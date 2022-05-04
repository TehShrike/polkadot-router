import { parse } from 'regexparam'
import orderedEntries from 'ordered-entries'

const createRouteMatcher = routeString => {
	const { keys, pattern } = parse(routeString)

	return path => {
		const matches = pattern.exec(path)

		if (!matches) {
			return null
		}

		return Object.fromEntries(
			keys.map((key, i) => [ key, matches[i + 1] || null ]),
		)
	}
}

const default404 = (req, res) => {
	res.statusCode = 404
	return `404 not found`
}

export default function createRouter(routesToMethodMaps, notFound = default404) {
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
	return routes.reduce((result, { matcher, ...rest }) => {
		if (result) {
			return result
		}

		const params = matcher(path)

		return params && {
			...rest,
			params,
		}
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
