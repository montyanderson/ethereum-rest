const url = require("url");
const Koa = require("koa");
const json = require("koa-json");
const stdrpc = require("stdrpc");
const abi = require("ethereumjs-abi");

const rpc = stdrpc("https://mainnet.infura.io/coTaYS64nfDJ0H12uzmw");

const app = new Koa();

app.use(json());

app.use(async ctx => {
	const {
		pathname,
		query
	} = url.parse(ctx.url, true);

	const [
		contract,
		method,
		_inputTypes,
		_outputTypes
	] = pathname
		.split("/")
		.slice(1);

	if(typeof method !== "string")
		return;

	const inputTypes = _inputTypes
		.split(":")
		.filter(x => x.length > 0);

	const outputTypes = _outputTypes
		.split(":")
		.filter(x => x.length > 0);

	const methodID = abi.methodID(method, inputTypes);

	const args = query.args ?
		JSON.parse(query.args) : [];

	const input = abi.rawEncode(inputTypes, args);

	const rawOutput = await rpc.eth_call({
		data: `0x${methodID.toString("hex")}${input.toString("hex")}`,
		to: contract,
		gas: "0x1000000"
	}, "latest");

	const output = abi.rawDecode(outputTypes, Buffer.from(rawOutput.slice(2), "hex"));

	ctx.body = output.map(arg => arg.toString(10));
});

app.listen(3000);
