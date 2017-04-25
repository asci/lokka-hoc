module.exports = function lokkifyFactory(lokkaClient, viewFramework) {

  if (!viewFramework && typeof window !== undefined) {
    viewFramework = window.React || window.preact;

    if (!viewFramework) {
      throw new Error('No suitable view layer found in window (expect to have: React or preact)');
    }
  }

  const jsxRenderer = viewFramework.createElement || viewFramework.h;
  if (!jsxRenderer) {
    throw new Error('No suitable jsx function provided (expect to have: React or preact)');
  }

  function fetcher(query, vars = {}) {
    return lokkaClient.query(query, vars);
  }

  function lokkify(ChildComponent, query, mutations = {}) {
    return class LokkaHighOrderComponent extends viewFramework.Component {
      constructor(...args) {
        super(...args);
        this.state = {
          loading: true,
          mutate(name, vars) {
            return mutations[name] && lokkaClient.mutate(mutations[name], vars);
          }
        };
      }

      componentWillUnmount() {
        this.mounted = false;
      }

      componentDidMount() {
        this.mounted = true;
        const refetch = (vars) => {
          this.mounted && fetcher(query, vars).then((data) => {
            this.mounted && this.setState({
              loading: false,
              refetch,
              errors: null,
              data
            });
          }, (errors) => {
            this.mounted && this.setState({
              loading: false,
              refetch,
              data: null,
              errors: [errors]
            });
          });
        };

        this.setState({
          loading: true
        });

        refetch();
      }

      render() {
        return jsxRenderer(
          ChildComponent,
          {...this.state, ...this.props},
          ...(this.props.children || [])
        );
      }
    };
  }

  return lokkify;
};
