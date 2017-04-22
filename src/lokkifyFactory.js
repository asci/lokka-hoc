module.exports = function lokkifyFactory(lokkaClient, jsxRenderer, Component) {

  if (!jsxRenderer) {
    jsxRenderer = require('react').createElement;
  }

  if (!Component) {
    Component = require('react').Component;
  }

  function fetcher(query, vars = {}) {
    return lokkaClient.query(query, vars);
  }

  function lokkify(ChildComponent, query, mutations = {}) {
    return class LokkaHighOrderComponent extends Component {
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
              errors
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
