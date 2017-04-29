describe('lokkifyFactory', function() {
  const lokkifyFactory = require('../src/lokkifyFactory.js');

  it('lokkifyFactory returns a function', function() {
    const lokkify = lokkifyFactory({}, {h: {}});
    expect(lokkify).toEqual(jasmine.any(Function));
  });

  describe('lokkify', () => {
    let fake;
    let freact;
    beforeEach(() => {
      fake = {
        client: {
          query() {},
          mutate() {}
        },
        renderer() {},
        Component: function Component() {
          this.setState = function setState(obj) {
            this.state = Object.assign({}, this.state, obj);
          };
        },
        ChildComponent() {}
      };
      freact = {h: (...args) => fake.renderer(...args), Component: fake.Component};
    });

    it('returns a component', function() {
      const lokkify = lokkifyFactory(fake.client, freact);
      expect(lokkify(fake.ChildComponent, '')).toEqual(jasmine.any(Function));
    });

    describe('LokkaHighOrderComponent', () => {
      it('enrich props with lokka related properies', function (done) {
        spyOn(fake.client, 'query').and.callFake(function(query, vars) {
          expect(query).toEqual('query-as-string');
          expect(vars).toEqual(jasmine.any(Object));
          return Promise.resolve('data');
        });

        const lokkify = lokkifyFactory(fake.client, freact);
        const LokkaHoc = lokkify(fake.ChildComponent, 'query-as-string');
        const instance = new LokkaHoc();

        instance.props = {fake: 'props'};
        instance.componentDidMount();
        expect(instance.state.loading).toEqual(true);
        setTimeout(() => {
          expect(instance.state.loading).toEqual(false);
          expect(instance.state.data).toEqual('data');
          expect(instance.state.mutate).toEqual(jasmine.any(Function));
          done();
        }, 10);
      });

      it('enrich props with lokka related properies when query is a function', function (done) {
        spyOn(fake.client, 'query').and.callFake(function(query, vars) {
          expect(query).toEqual('query-as-function');
          expect(vars).toEqual(jasmine.any(Object));
          return Promise.resolve('data');
        });

        const lokkify = lokkifyFactory(fake.client, freact);
        const LokkaHoc = lokkify(fake.ChildComponent, (props) => {
          expect(props.fake).toEqual('props');
          return 'query-as-function';
        });
        const instance = new LokkaHoc();

        instance.props = {fake: 'props'};
        instance.componentDidMount();
        expect(instance.state.loading).toEqual(true);
        setTimeout(() => {
          expect(instance.state.loading).toEqual(false);
          expect(instance.state.data).toEqual('data');
          expect(instance.state.mutate).toEqual(jasmine.any(Function));
          done();
        }, 10);
      });

      it('renders a child component', function (done) {
        spyOn(fake, 'renderer').and.callFake(function(Component, props, children) {
          expect(Component).toEqual(fake.ChildComponent);
          expect(children).toEqual(undefined);
          done();
        });

        const lokkify = lokkifyFactory(fake.client, freact);
        const LokkaHoc = lokkify(fake.ChildComponent, '');
        const instance = new LokkaHoc();

        instance.props = {fake: 'props'};
        instance.render();
      });
    });
  });
});
