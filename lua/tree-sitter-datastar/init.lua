local M = {}

local function register()
	local file = debug.getinfo(1, 'S').source:match('@(.*/)')
	local plugin_dir = vim.fn.fnamemodify(file, ':p:h:h:h')

	require('nvim-treesitter.parsers').datastar = {
		install_info = {
			path = plugin_dir,
			files = { 'src/parser.c', 'src/scanner.c' },
			generate_requires_npm = false,
			requires_generate_from_grammar = false,
		},
	}

	vim.treesitter.language.register('datastar', { 'html', 'templ', 'jsx', 'tsx' })
end

function M.setup()
	local ok, _ = pcall(require, 'nvim-treesitter.parsers')
	if not ok then
		return
	end

	register()

	vim.api.nvim_create_autocmd('User', {
		pattern = 'TSUpdate',
		callback = register,
	})

	local installed = vim.fs.joinpath(
		vim.fn.stdpath('data'), 'site', 'parser', 'datastar.so')
	if not vim.uv.fs_stat(installed) then
		vim.schedule(function()
			require('nvim-treesitter.install').install({ 'datastar' })
		end)
	end
end

return M
