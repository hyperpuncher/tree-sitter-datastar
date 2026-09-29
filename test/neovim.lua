-- Run with NVIM_TREESITTER pointing to a current nvim-treesitter checkout.
local dependency = assert(vim.env.NVIM_TREESITTER, 'set NVIM_TREESITTER to the nvim-treesitter checkout')
local root = vim.fn.getcwd()
local directory = vim.fn.tempname()
vim.fn.mkdir(directory, 'p')

local ok, error = pcall(function()
	vim.opt.runtimepath:prepend(dependency)
	vim.opt.runtimepath:prepend(root)
	vim.opt.runtimepath:append(root .. '/after')
	vim.opt.runtimepath:append(vim.fn.stdpath('data') .. '/site')
	require('nvim-treesitter').setup({ install_dir = directory })
	local plugin = require('tree-sitter-datastar')
	local hosts = {}
	for _, host in ipairs({ 'html', 'templ', 'jsx', 'tsx' }) do
		hosts[host] = vim.treesitter.language.get_lang(host)
	end
	plugin.setup()
	local parserFile = directory .. '/parser/datastar.so'
	assert(vim.wait(60000, function()
		return vim.uv.fs_stat(parserFile) ~= nil
			and vim.uv.fs_stat(directory .. '/queries/datastar/highlights.scm') ~= nil
	end), 'parser and query installation timed out')

	plugin.setup()
	assert(#vim.api.nvim_get_autocmds({ group = 'TreeSitterDatastar' }) == 1)
	for host, language in pairs(hosts) do
		assert(vim.treesitter.language.get_lang(host) == language, 'host language was overridden: ' .. host)
	end
	vim.api.nvim_exec_autocmds('User', { pattern = 'TSUpdate' })
	assert(require('nvim-treesitter.parsers').datastar.install_info.path == root)

	local parser = vim.treesitter.get_string_parser('<button data-on:click="$count++"></button>', 'html')
	parser:parse(true)
	local child = assert(parser:children().datastar, 'Datastar injections were not loaded')
	for _, tree in ipairs(child:trees()) do
		assert(not tree:root():has_error(), 'injected syntax did not parse')
	end
	assert(vim.treesitter.query.get('datastar', 'highlights'), 'highlight query was not loaded')
end)
vim.fn.delete(directory, 'rf')
assert(ok, error)
print('neovim installation and injections: all checks passed')
