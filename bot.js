require('dotenv').config()
const { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } = require('discord-akairo')
const Discord = require('discord.js')
const version = require('./package.json').version

var config
try {
  console.log('Attempting to use development config...')
  config = require('./config-dev.json')
} catch (err) {
  console.log('Failed to find development config...trying production...')
}

if (!config) {
  try {
    config = require('./config-prod.json')
  } catch (err) {
    console.error('Failed to load a production config...missing config file?')
    process.exit(1)
  }
} else {
  console.log('Starting up with development config...')
}

const embed = new Discord.MessageEmbed()
  .setFooter(config.embeds.footer)
  .setColor(config.embeds.color)

module.exports = {
  config,
  embed,
  enableMaintenance,
  disableMaintenance
}

class MainClient extends AkairoClient {
  constructor() {
    super({
      ownerID: config.owners
    }, {
      fetchAllMembers: true,
      presence: {
        status: 'online',
        activity: {
          name: `${config.prefix}help | ${version}`,
          type: 'WATCHING'
        }
      }
    })
    this.commandHandler = new CommandHandler(this, {
      directory: './commands/',
      prefix: config.prefix,
      defaultCooldown: 5000,
      commandUtil: true
    })
    this.staffComandHandler = new CommandHandler(this, {
      directory: './staff_commands/',
      prefix: config.staffPrefix,
      defaultCooldown: 1000,
      commandUtil: true
    })

    this.staffInhibitorHandler = new InhibitorHandler(this, {
      directory: './staff_inhibitors/'
    })

    this.listenerHandler = new ListenerHandler(this, {
      directory: './listeners/'
    })

    // Main Handlers
    this.commandHandler.useListenerHandler(this.listenerHandler)
    this.listenerHandler.loadAll()
    this.commandHandler.loadAll()

    // Staff Handlers
    this.staffComandHandler.useInhibitorHandler(this.staffInhibitorHandler)
    this.staffComandHandler.loadAll()
    this.staffInhibitorHandler.loadAll()
  }
}
const client = new MainClient()

function enableMaintenance() {
  client.commandHandler.removeAll()
  client.listenerHandler.removeAll()
  client.user.setPresence({
    status: 'dnd',
    activity: {
      name: `Offline - Back soon!`,
      type: 'WATCHING'
    }
  })
}

function disableMaintenance() {
  client.commandHandler.loadAll()
  client.listenerHandler.loadAll()
  client.user.setPresence({
    status: 'online',
    activity: {
      name: `${config.prefix}help | ${version}`,
      type: 'WATCHING'
    }
  })
}

if (config.token) {
  console.log("Logging in via config token...")
  client.login(config.token)
} else {
  console.log("Logging in via environment token...")
  client.login(process.env.BOT_TOKEN)
}
