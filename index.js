const regexpararm = require(`@tehshrike/regexparam`)
const orderedEntries = require(`ordered-entries`)

const createRouteMatcher = routeString => {
	const { keys, pattern } = regexpararm(routeString)

	return path => {
		const matches = pattern.exec(path)

		if (!matches) {
			return null
		}

		const params = {}
		keys.forEach((key, i) => {
			params[key] = matches[i + 1] || null
		})

		return params
	}
}

const default404 = (req, res) => {
	res.statusCode = 404
	return `404 not found`
}

module.exports = function createRouter(routesToMethodMaps, notFound = default404) {
	const routes = orderedEntries(routesToMethodMaps).map(([ routeString, methodMap ]) => {
		validateInputMap(methodMap)

		return {
			matcher: createRouteMatcher(routeString),
			methodMap,
		}
	})

	return (req, res) => {
		const { method, path } = req

		const matched = findMatchingRouteAndParseParams(routes, path)

		if (matched) {
			const { params, methodMap } = matched
			const handler = methodMap[method]

			if (handler) {
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

function findMatchingRouteAndParseParams(routes, path) {
	return getFirstTruthyReturnValue(routes, ({ matcher, ...rest }) => {
		const params = matcher(path)

		return params && {
			...rest,
			params,
		}
	})
}

function getFirstTruthyReturnValue(ary, fn) {
	return ary.reduce((result, input) => {
		if (result) {
			return result
		}

		return fn(input)
	}, null)
}

function validateInputMap(objectWithMethodKeys) {
	const methods = Object.keys(objectWithMethodKeys)
	methods.forEach(method => {
		if (method.toUpperCase() !== method) {
			throw new Error(`Bad method - you probably want to uppercase '${ method }'`)
		}
	})
}
