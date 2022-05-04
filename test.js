import { parse as parseUrl } from 'url'
import test from 'zora'
import createRouter from "./index.js"

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
		'/yes/but': {
			GET: async() => {
				await wait(50)

				return `lol butts`
			},
		},
		'/yes/:and': {
			GET: async req => `you said ${ req.params.and }`,
		},
		'/whatever': {
			POST: async() => {
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
	const dummyRoute = { '/meh': { PUT: () => undefined } }
	const no404Middleware = createRouter(dummyRoute, noop)
	const setting404Middleware = createRouter(dummyRoute)

	const { res: no404Response } = await polkaRequestSimulator(no404Middleware, `PUT`, `/whatever`)
	t.equal(no404Response.statusCode, undefined)

	const { res: set404Response } = await polkaRequestSimulator(setting404Middleware, `PUT`, `/whatever`)
	t.equal(set404Response.statusCode, 404)
})

test(`Thrown errors can be caught without an await`, async t => {
	const router = createRouter({
		throw: {
			GET: () => {
				throw new Error(`intentional`)
			},
		},
	})

	const url = `/throw`
	const { path, query, search } = parseUrl(url)
	const req = { method: `GET`, url, path, query, search }

	try {
		router(req, {})
		t.fail(`An error should be thrown`)
	} catch (err) {
		t.equal(err.message, `intentional`)
	}
})
