const parseUrl = require(`url`).parse
const test = require(`zora`)
const createRouter = require(`./`)

async function polkaRequestSimulator(router, method, url) {
	const { path, query, search } = parseUrl(url)
	const req = { method, url, path, query, search }
	const res = {}

	const body = await router(req, res)

	return {
		req,
		res,
		body,
	}
}

const assertBodyHelper = t => (simulatedRequestResponse, expected) =>
	t.equal(simulatedRequestResponse.body, expected, `Should return ${ expected }`)
const wait = time => new Promise(resolve => setTimeout(resolve, time))

test(`Basic cases`, async t => {
	const router = createRouter({
		GET: {
			'/yes/but': async() => {
				console.log(`but called`)
				await wait(50)

				return `lol butts`
			},
			'/yes/:and': async req => `you said ${ req.params.and }`,
		},
		POST: {
			'/whatever': async() => {
				t.fail()
			},
		},
	}, () => `NOT FOUND`)

	const assertBody = assertBodyHelper(t)

	assertBody(await polkaRequestSimulator(router, `GET`, `/yes/please`), `you said please`)
	assertBody(await polkaRequestSimulator(router, `GET`, `/yes/but`), `lol butts`)
	assertBody(await polkaRequestSimulator(router, `GET`, `/no`), `NOT FOUND`)
	assertBody(await polkaRequestSimulator(router, `POST`, `/yes/please`), `NOT FOUND`)
})

const noop = () => {}

test(`Setting 404 when there are no matching methods`, async t => {
	const no404Middleware = createRouter({}, noop)
	const setting404Middleware = createRouter({})

	const { res: no404Response } = await polkaRequestSimulator(no404Middleware, `PUT`, `/whatever`)
	t.equal(no404Response.statusCode, undefined)

	const { res: set404Response } = await polkaRequestSimulator(setting404Middleware, `PUT`, `/whatever`)
	t.equal(set404Response.statusCode, 404)
})

test(`Setting 404 when there are matching methods but no matching routes`, async t => {
	const dummyRoute = { PUT: { '/meh': () => undefined } }
	const no404Middleware = createRouter(dummyRoute, noop)
	const setting404Middleware = createRouter(dummyRoute)

	const { res: no404Response } = await polkaRequestSimulator(no404Middleware, `PUT`, `/whatever`)
	t.equal(no404Response.statusCode, undefined)

	const { res: set404Response } = await polkaRequestSimulator(setting404Middleware, `PUT`, `/whatever`)
	t.equal(set404Response.statusCode, 404)
})
