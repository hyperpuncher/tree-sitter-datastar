-- Run with: nvim --headless -u NONE -l test/injections.lua
vim.opt.runtimepath:append(vim.fn.stdpath('data') .. '/site')
local root = vim.fn.getcwd()
local function read(path)
	return table.concat(vim.fn.readfile(root .. '/' .. path), '\n')
end

for host, directory in pairs({ html = 'html', templ = 'templ', javascript = 'jsx', tsx = 'tsx' }) do
	vim.treesitter.query.parse(host, read('after/queries/' .. directory .. '/injections.scm'))
end
vim.treesitter.query.parse('html', read('docs/helix-html-injections.scm'))

local function contents(host, path, source)
	local query = vim.treesitter.query.parse(host, read(path))
	local parser = vim.treesitter.get_string_parser(source, host)
	local tree = parser:parse()[1]
	assert(not tree:root():has_error(), 'invalid host fixture: ' .. host)
	local result = {}
	for id, node in query:iter_captures(tree:root(), source) do
		if query.captures[id] == 'injection.content' then
			local text = vim.treesitter.get_node_text(node, source)
			result[text] = (result[text] or 0) + 1
		end
	end
	return result
end

local html = [[<div data-on:click="$count++" data-onboarding="wrong"
 data-bind="user.name" data-indicator="loading" data-ref="input"
 data-preserve-attr="open class" data-nonce="abc123"
 data-star-text="$title" data-bind:name__root
 data-on:input__debounce.300ms="$query = evt.target.value"
 data-rocket="old" data-match-media:dark="prefers-color-scheme: dark"
 data-star-match-media:wide="'(min-width: 800px)'"></div>]]
local expected = {
	['data-on:click'] = 1, ['$count++'] = 1,
	['data-bind'] = 1, ['data-indicator'] = 1, ['data-ref'] = 1,
	['data-preserve-attr'] = 1, ['data-nonce'] = 1,
	['data-star-text'] = 1, ['$title'] = 1, ['data-bind:name__root'] = 1,
	['data-on:input__debounce.300ms'] = 1, ['$query = evt.target.value'] = 1,
	['data-match-media:dark'] = 1, ['data-star-match-media:wide'] = 1,
	["'(min-width: 800px)'"] = 1,
}
for _, path in ipairs({ 'after/queries/html/injections.scm', 'docs/helix-html-injections.scm' }) do
	assert(vim.deep_equal(contents('html', path, html), expected), path)
end

local jsx = [[const view = <div data-on:click="$count++" data-text={`$title`}
 data-on:input={`$query = evt.target.value`} data-bind="user.name"
 data-onboarding="wrong" data-init={`@get('${url}')`}
 data-match-media:dark="prefers-color-scheme: dark"
 data-match-media:wide="'(min-width: 800px)'"
 data-match-media:print={`'(print)'`}
 attrs={{ 'data-star-show': '$visible', 'data-ref': 'input',
 'data-textual': 'wrong', 'data-match-media:small': '(max-width: 400px)',
 'data-match-media:medium': "'(min-width: 600px)'" }} />;
const unrelated = { 'data-text': 'wrong' };]]
local jsxExpected = {
	['data-on:click'] = 1, ['$count++'] = 1,
	['data-text'] = 1, ['$title'] = 1,
	['data-on:input'] = 1, ['$query = evt.target.value'] = 1,
	['data-bind'] = 1, ['data-star-show'] = 1, ['$visible'] = 1, ['data-ref'] = 1,
	['data-init'] = 1, ['data-match-media:dark'] = 1, ['data-match-media:wide'] = 1,
	["'(min-width: 800px)'"] = 1, ['data-match-media:print'] = 1, ["'(print)'"] = 1,
	['data-match-media:small'] = 1, ['data-match-media:medium'] = 1,
	["'(min-width: 600px)'"] = 1,
}
for host, directory in pairs({ javascript = 'jsx', tsx = 'tsx' }) do
	assert(vim.deep_equal(contents(host, 'after/queries/' .. directory .. '/injections.scm', jsx), jsxExpected), host)
end
print('injection queries: all checks passed')
