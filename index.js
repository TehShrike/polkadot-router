const processInputMaps = require(`./process-input-maps`)

const default404 = (req, res) => {
	res.statusCode = 404
	return `404 not found`
}

module.exports = function createRouter(methodsToRouteMaps, notFound = default404) {
	validateInputMap(methodsToRouteMaps)
	const getRoutesForMethod = processInputMaps(methodsToRouteMaps)

	return (req, res) => {
		const { method, path } = req
		const routes = getRoutesForMethod(method)

		if (routes) {
			const matched = findMatchingRoute(routes, path)

			if (matched) {
				const { params, handler } = matched
				req.params = params

				return handler(req, res)
			} else {
				return notFound(req, res)
			}
		} else {
			return notFound(req, res)
		}
	}
}

function findMatchingRoute(routes, path) {
	return returnFirst(routes, ({ matcher, handler }) => {
		const params = matcher(path)

		return params && {
			params,
			handler,
		}
	})
}

function returnFirst(ary, fn) {
	return ary.reduce((result, input) => {
		if (result) {
			return result
		}

		return fn(input)
	}, null)
}

function validateInputMap(methodsToRouteMaps) {
	const methods = Object.keys(methodsToRouteMaps)
	methods.forEach(method => {
		if (method.toUpperCase() !== method) {
			throw new Error(`Bad method - you probably want to uppercase '${ method }'`)
		}
	})
}
