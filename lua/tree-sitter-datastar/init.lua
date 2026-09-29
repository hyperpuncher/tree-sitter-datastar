local M = {}

local function register()
	local file = debug.getinfo(1, 'S').source:match('@(.*/)')
	local plugin_dir = vim.fn.fnamemodify(file, ':p:h:h:h')

	require('nvim-treesitter.parsers').datastar = {
		install_info = {
			path = plugin_dir,
			queries = 'queries/datastar',
		},
	}
end

function M.setup()
	local ok, treesitter = pcall(require, 'nvim-treesitter')
	if not ok then
		return
	end

	register()
	vim.api.nvim_create_autocmd('User', {
		group = vim.api.nvim_create_augroup('TreeSitterDatastar', { clear = true }),
		pattern = 'TSUpdate',
		callback = register,
	})

	-- nvim-treesitter handles its configured install directory and skips installed parsers.
	treesitter.install({ 'datastar' })
end

return M
