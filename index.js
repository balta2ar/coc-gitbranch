const { sources, workspace } = require('coc.nvim')
const { spawn } = require('child_process')

// var script
// var args

function onStdoutAvailable(command, args, token, onSuccess) {
  const child = spawn(command, args)
  return new Promise((resolve, reject) => {
    let output = ''
    let exited = false
    token.onCancellationRequested(() => {
      child.kill('SIGHUP')
      resolve(null)
    })
    child.stdout.on('data', data => {
      output = output + data.toString()
    })
    child.on('exit', () => {
      exited = true
      if (!output) return resolve(null)
      try {
        return resolve(onSuccess(output))
      } catch (e) {
        reject(new Error('invalid output from git ' + e))
      }
    })
    setTimeout(() => {
      if (!exited) {
        child.kill('SIGHUP')
        reject(new Error('git timeout'))
      }
    }, 2000)
  })
}

exports.activate = context => {
  let source = {
    name: 'gitbranch',
    //triggerCharacters: ['G'],
    triggerOnly: true,
    triggerPatterns: [
      /(GIT)/
    ],
    doComplete: function (_opt, token) {
      let trigger = 'GIT'
      // if (!opt.input) return Promise.resolve(null)
      // if (opt.input.length < 2) return Promise.resolve(null)
      // if (!opt.input.startsWith(trigger)) return Promise.resolve(null)

      const script = 'git'
      const args = ['for-each-ref', '--sort=-committerdate', 'refs/heads/', '--format="%(refname:short),%(objectname:short)"']
      return onStdoutAvailable(script, args, token, (output) => {
        let list = output.split('\n')
        return {
          items: list.map(item => {
            const [branch, revision] = item.slice(1, -1).split(',')
            return {
              word: branch,
              abbr: branch,
              filterText: `${trigger}${branch}`,
              menu: revision
            }
          })
        }
      })
    }
  }

  context.subscriptions.push(sources.createSource(source))
}

