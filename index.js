const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const { Client, Util } = require('discord.js');
require('./util/eventLoader.js')(client);
const fs = require('fs');
const  db  = require('nrc.db')


var prefix = ayarlar.prefix;

const log = message => {
    console.log(`${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./komutlar/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});




client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};




client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
    console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
    console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});
///////////////////////Youtube Bot log
client.on("message", message => {
let ytlog = db.fetch(`ytlog_${message.guild.id}`)
let kanalid = db.fetch(`kanalid_${message.guild.id}`) 

const ytch = require('yt-channel-info')

let id = kanalid
let type = "user"
if(id) {
    ytch.getChannelInfo(id, type).then((response) => { 


        setInterval(() => {
            client.channels.cache.get(ytlog).send("Şu anda **"+response.subscriberCount+" **Abone var")
            }, 5000)

          

    })
}



///////////////////////Youtube Bot bildirim


const nrc = new (require("rss-parser"))();


function handleUploads() {
    if (db.fetch(`postedVideos`) === null) db.set(`postedVideos`, []);
    setInterval(() => {
        nrc.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${kanalid}`)
        .then(nrc1 => {
            if (db.fetch(`postedVideos`).includes(nrc1.items[0].link)) return;
            else {
                db.set(`videoData`, nrc1.items[0]);
                db.push("postedVideos", nrc1.items[0].link);
                let nrcvideo = db.fetch(`videoData`);
                let channel = db.fetch(`ytbildirim_${message.guild.id}`)
                if (!channel) return;
                let message = "Hey `@everyone`, **{author}** Yeni Video Yükledi: **{title}**!\n{url}"
                    .replace(/{author}/g, nrcvideo.author)
                    .replace(/{title}/g, Discord.Util.escapeMarkdown(nrcvideo.title))
                    .replace(/{url}/g, nrcvideo.link);
                channel.send(message);
            }
        });
    }, 30000);
}

});


    
client.login(ayarlar.token);
