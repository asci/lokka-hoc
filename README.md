# lokka-hoc
High order component for Lokka GraphQL client

[![Code Climate](https://codeclimate.com/github/asci/lokka-hoc/badges/gpa.svg)](https://codeclimate.com/github/asci/lokka-hoc)

## Warning
This package in development. Not all features from Lokka\GraphQL are supported.

Current features:
- query
- query with variables
- mutate
- mutate with variables

## How to install
```
npm i lokka-hoc -S
```

## How to use
```js
/*
 * Import dependencies
 */
import { Lokka } from 'lokka';
import { Transport } from 'lokka-transport-http';
import { lokkifyFactory } from 'lokka-hoc';

/*
 * Setup Lokka client
 */
const client = new Lokka({
  transport: new Transport('<your-graphql-server-url>')
});

/*
 * Create `lokkify` connect function
 * this could be done once and you can export `lokkify`
 */
// React by default
const lokkify = lokkifyFactory(client);

// or React explicitly (if you don't have it in global)
const lokkify = lokkifyFactory(client, React);

// or preact explicitly (if you don't have it in global)
const lokkify = lokkifyFactory(client, preact);

/*
 * Define your component
 */
function App(props) {
  return (
    <div>
        {
          props.loading
            ? 'Loading'
            : [
              props.errors && props.errors.map(err => <h3>{err.message}</h3>),
              props.data && <h3>Data: {props.data}</h3>
            ]
        }
    </div>
  );
}

/*
 * Connect component and query using `lokkify`
 */
export default lokkify(App, /* GraphQL */`{
  posts {
    id,
    title,
    content
  }
}`);

```

## API
### lokkifyFactory
With this function you create connect function which will be able to do querying and rendering

`lokkifyFactory(<Lokka client>, [React || preact])` it will return `lokkify` function

### lokkify
`lokkify` is used to connect your component and graphql.
`lokkify(App, query, mutations)` where
- `App` component you want to connect
- `query` string representing your main graphql query
- `mutations` object where key is a name for mutation and value is graphql mutation string.

### this.props.loading
`boolean` value for current query state

### this.props.data
`any` result of main query

### this.props.errors
`array` all errors occurred during the query

### this.props.refetch([vars])
`function` to refetch main query with optional `vars`

### this.props.mutate(name, [vars])
`function` to mutation with name (name is a key from `lokkify` third argument object) and vars. Returns a `Promise`


## Motivation
I like the idea of simplicity and modularity of `lokka`. But it required a lot of boilerplate code. I was also inspired by simplicity of `react-apollo`. Unfortunately it doesn't simple to make it work with `preact` or any other react-like libraries.
