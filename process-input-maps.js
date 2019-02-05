const orderedEntries = require(`ordered-entries`)
const regexpararm = require(`@tehshrike/regexparam`)

function mapObject(o, fn) {
	return orderedEntries(o).reduce((map, [ key, value ]) => {
		map[key] = fn(value)
		return map
	}, Object.create(null))
}

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

// [routeString]: handler
function routeMapToArray(methodHandlers) {
	return orderedEntries(methodHandlers).map(([ routeString, handler ]) => {
		const matcher = createRouteMatcher(routeString)
		return { matcher, handler }
	})
}

module.exports = methodsToRouteMaps => {
	const methodsToRouteArrays = mapObject(methodsToRouteMaps, routeMapToArray)

	return method => methodsToRouteArrays[method]
}
