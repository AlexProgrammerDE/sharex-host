const express = require('express')
const app = express()

const mime = require('mime-types')
const upload = require('express-fileupload')
const rand = require('random-id')
const cooldown = new Set()

const url = 'https://images.pistonmaster.net'
const owner_contact = 'Pistonmaster#0001'

app.use(upload({preserveExtension: true, safeFileNames: true, limits: {fileSize: 100 * 1024 * 1024}}))
app.use(express.json())

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/images/index.html')
})

app.get('/:image', async (req, res) => {
    if (!require('fs').existsSync(__dirname + '/images/' + req.params.image)) return res.status(404).send('Image not found.')
    const myRegexp = /^([^ ]*)\.([^ ]*)$/g
    if (!myRegexp.exec(req.params.image)) {
        return res.status(500).send('no extension')
    }

    if (match[2] !== 'png' || !req.params.image.startsWith('!')) {
        res.sendFile(__dirname + '/images/' + req.params.image)
    }
})

app.get('/i/:image', async (req, res) => {
    if (!require('fs').existsSync(__dirname + '/images/' + req.params.image)) return res.status(404).send('Image not found.')
    res.sendFile(__dirname + '/images/' + req.params.image)
})

app.post('/upload', async (req, res) => {
    const fs = require('fs')
    const keys = JSON.parse(fs.readFileSync(__dirname + '/data/keys.json', 'utf-8'))
    if (keys.includes(req.headers.authorization)) {
        if (cooldown.has(req.headers.authorization)) {
            return res.status(429).send('You can only send an image every 5 seconds. (Abuse will result in removal of all images and api key revoked.)')
        }
        const file = req.files.file

        const id = rand(6, 'aA0')
        const ext = mime.extension(file.mimetype)
        const exts = ['png', 'jpg', 'jpeg', 'jpe', 'jfif', 'exif', 'bmp', 'dib', 'rle', 'tiff', 'tif', 'gif', 'tga', 'dds', 'jxr', 'wdp', 'wmp', 'heic', 'webp', 'mp4', 'avi', 'mpeg', 'mp3']
        if (!exts.includes(ext)) {
            return res.status(403).send('Not a valid type')
        }
        console.log(ext)
        const fileName = id + '.' + ext
        await file.mv(__dirname + '/images/' + fileName)

        res.send(`${url}/${fileName}`)

        cooldown.add(req.headers.authorization)
        setTimeout(() => {
            cooldown.delete(req.headers.authorization)
        }, 15 * 1000)
        fs.appendFile(__dirname + '/data/log.txt', `${fileName} | ${req.headers.authorization} | ${req.headers['x-forwarded-for']} | ${req.connection.remoteAddress}` + '\n', (err) => {
            if (err) throw err
        })
    } else {
        res.status(401).send('Not authorized. Contact ' + owner_contact + ' for an api key if interested!')
    }
})

// listen for requests :)
app.listen(3000)
