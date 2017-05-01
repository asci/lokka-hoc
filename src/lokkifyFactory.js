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
    let queryFunc = query;
    if (typeof query === 'string') {
      queryFunc = () => query;
    }

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

      componentWillReceiveProps(nextProps) {
        if (queryFunc(this.props) !== queryFunc(nextProps)) {
          setTimeout(() => this._refetch());
        }
      }

      componentWillUnmount() {
        this.mounted = false;
      }

      componentDidMount() {
        this.mounted = true;
        this.queryId = 0;
        const refetch = (vars) => {
          const queryId = ++this.queryId;
          this.mounted && fetcher(queryFunc(this.props), vars).then((data) => {
            this.mounted && queryId === this.queryId && this.setState({
              loading: false,
              refetch,
              errors: null,
              data
            });
          }, (errors) => {
            this.mounted && queryId === this.queryId && this.setState({
              loading: false,
              refetch,
              data: null,
              errors: [errors]
            });
          });
        };
        this._refetch = refetch;
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
