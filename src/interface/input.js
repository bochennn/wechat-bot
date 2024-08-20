import readline from 'readline'
import { print_usage } from './command.js'

export const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

terminal.setPrompt('> ')

terminal.on('line', (input) => {
    if (input === 'help') {
        print_usage()
    }

    terminal.prompt()
})

terminal.on('close', () => {
    process.exit(0)
})

process.on('SIGINT', () => {
    terminal.close()
})