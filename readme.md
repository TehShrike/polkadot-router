# polkadot-router

*See also: [koa-bestest-router](https://github.com/TehShrike/koa-bestest-router)*

Built for the tiny, nifty [polkadot](https://github.com/lukeed/polkadot) server framework.

No mutations, not much code = easy to understand and debug.

# API

A single function.  It takes a POJO map of HTTP methods to a map of routes to handler functions.

It returns a request handler function.

```js
import polkaDot from 'polkadot'
import createRouter from 'polkadot-router'

const notFoundHandler = (req, res) => {
	res.statusCode = 404
	return '404 not found sorry'
}

const router = createRouter({
	'/pie': {
		GET: async (req, res) => {
			return 'Yay pie!'
		}
	},
	'/cake/:flavor': {
		GET: async (req, res) => {
			return `I like ${req.params.flavor} cake`
		},
		POST: async (req, res) => {
			await someDb.addFlavor(req.params.flavor)
		}
	}
}, notFoundHandler)

polkaDot(router).listen(8080)
```

## `router = createRouter(routes, [notFoundHandler])`

`routes` is a map of HTTP methods to maps of [regexparam](https://github.com/lukeed/regexparam) routes to handler functions.

Routes will be checked in a deterministic order from top to bottom, [thanks to ES2015](http://stackoverflow.com/questions/30076219/does-es6-introduce-a-well-defined-order-of-enumeration-for-object-properties).

`notFoundHandler` is the function to be called if no route is found.  Defaults to:

```js
(req, res) => {
	res.statusCode = 404
	return `404 not found`
}
```

# License

[WTFPL](http://wtfpl2.com)
