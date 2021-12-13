const seedrandom = require('seedrandom')
seedrandom('Hi there!', {global: true})

Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

// let melody = `a4 g#4 f#4 e4 d4 c#4 c#4 c#4 a3 f#4 e4 d4 c#4 b3 a3 a3 b3 b3 a3 b3 c#4 e4 f#4 g#4 f#4 f4 f4 g4 f4 e4 d4 e4 d4 c#4 b4 a3`.split(' ')
// let rhythm = `4n 4n 8n 8n 8n 8n 8n 8n 2n 4n 4n 8n 8n 8n 8n 1n 4n 4n 8n 8n 8n 8n 4n 4n 4n 4n 8n 4n 4n 8n 8n 8n 8n 2n 8n 8n 8n 8n 4n`.split(' ')
let melody = `g4 e4 f4 g4 g4 g4 a4 b4 c5 c5 e4 f4 g4 g4 g4 a4 g4 f4 f4 e4 g4 c4 e4 d4 f4 b3 c4`.split(' ')
let rhythm = `8n 8n 8n 4n 4n. 8n 8n 8n 4n 2n 8n 8n 4n 4n 4n 8n 8n 8n 2n 4n 4n 4n 4n 4n 2n 4n 1n`.split(' ')

// let melody = `g3 c4 c4 c4 d4 e4 e4 e4 e4 d4 e4 f4 b3 d4 c4`.split(' ')
// let rhythm = `4n 8n 8n 8n 4n 8n 8n 8n 8n 8n 8n 4n 4n 4n 4n`.split(' ')

class Markov {
    constructor(input) {
        this.input = input

        this.chain = {}

        for (let i = 0; i < input.length; i++) {
            if (!(this.chain[input[i]])) this.chain[input[i]] = []
            this.chain[input[i]].push(input[i + 1])
        }

        console.log(this.chain);
    }

    generate(iterations) {
        let result = [this.input[0]]

        for (let i = 0; i <= iterations; i++) {
            if (!(this.chain[result[result.length - 1]])) result.push(this.input.random())
            result.push(this.chain[result[result.length - 1]].random())
        }
        
        return result
    }
}

function lowerOctave(note) {
    return `${note.substring(0, note.length - 1)}${parseInt(note[note.length - 1]) - 1}`
}

let melodyModel = new Markov(melody)
let rhythmModel = new Markov(rhythm)

//server
const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    let scale = 'c4 d4 e4 f4 g4 a4 b4 c5 d5 e5 f5 g5 a5 b5 c6'.split(' ')


    let finishedMelody = melodyModel.generate(200).concat([scale[0], scale[2], scale[4], scale[6], scale[7]])
    let finishedRhythm = rhythmModel.generate(204)

    let MidiWriter = require('midi-writer-js');

    // Start with a new tracks[0]
    let tracks = []
    tracks[0] = new MidiWriter.Track();
    tracks[1] = new MidiWriter.Track();

    // Add some notes:
    finishedMelody.forEach((note, i) => {
        if (note) {
            let duration
            if (finishedRhythm[i]) {
                duration = finishedRhythm[i]
            } else {
                duration = 1;
            }
    
            let upperChord = [note]
            if (Math.round(Math.random() * 20) === 0) {
                    upperChord.push(Math.round(Math.random() * 20) === 10 ? scale[scale.indexOf(note) + 5] : scale[scale.indexOf(note) + 2])
            } else if (!(i % 2 === 0)) {
                let i = [lowerOctave(scale[0]), lowerOctave(scale[2]), lowerOctave(scale[4])]
                let iv = [lowerOctave(scale[0]), lowerOctave(scale[3]), lowerOctave(scale[5])]
                let v = [lowerOctave(scale[1]), lowerOctave(scale[4]), lowerOctave(scale[6])]
                let lowerChord = []

                {
                    while (!(lowerChord.includes(note.substring(0, note.length - 1) + '3'))) {
                        lowerChord = [i, iv, v].random()
                    }
                }

                let lowerEvent = new MidiWriter.NoteEvent({pitch: lowerChord, duration: '1n', velocity: 70});
                tracks[1].addEvent(lowerEvent)
            }

            let upperEvent = new MidiWriter.NoteEvent({pitch: upperChord, duration: duration, velocity: 100});
            tracks[0].addEvent(upperEvent);
    

        }
    })

    // Generate a data URI
    let write = new MidiWriter.Writer(tracks);

    res.render('index', {notes: finishedMelody, rhythm: finishedRhythm, dataUri: write.dataUri()})
})
app.listen(3000)