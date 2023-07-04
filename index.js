const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const fs = require("fs")
const colors = require("colors");
require('dotenv').config()

const riotKey = process.env.RIOT_KEY
const sp = '%20'
const limit = (120 / 100) * 1000

const patchDate = new Date('Jun 28 2023')
// const euw1_platinum_1 = require("./rank_data/euw1/PLATINUM/I/PLATINUM_I.json")
const euw1_platinum_1_puuids = require("./rank_data/euw1/PLATINUM/I/puuids.json")
const euw1_platinum_1_games = require("./rank_data/euw1/PLATINUM/I/games.json")
const Ranks = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']
const Division = ['IV', 'III', 'II', 'I']

// start()
async function start() {
    let debug = 0
    let r = 0
    let d = 0
    let finished = 0

    setInterval(function () {
        let dir = `./rank_data/euw1/${Ranks[r]}/${Division[d]}`
        if (fs.existsSync(dir) === true) {
            if (d !== 3) {
                debug = 1
                d += 1
                getPlayersByRank('euw1', Ranks[r], Division[d])
                console.log(dir)
            } else {
                d = 0
                r += 1
                getPlayersByRank('euw1', Ranks[r], Division[d])
                console.log(dir, `Rank: ${Ranks[r]}`)
            }
        } else if (debug === 0) {
            console.log('first')
            getPlayersByRank('euw1', Ranks[r], Division[d])
        }
    }, 5000)
}

async function getPlayersByRank(server, queue, division) {
    let allData = []
    let conc;
    let page = 0

    let interval = setInterval(async function () {
        let link = `https://${server}.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${queue}/${division}?page=${page}&${riotKey}`

        try {
            response = await fetch(link)
            data = await response.json()
            conc = data.length
            page += 1
            allData.push(data)
            console.log(page, 'page')
        } catch (err) {
            console.log(err)
        }

        if (conc < 205) {
            let dir1 = `./rank_data/${server}`
            let dir2 = `./rank_data/${server}/${queue}`
            let dir3 = `./rank_data/${server}/${queue}/${division}`

            if (fs.existsSync(dir1) && fs.existsSync(dir2) && fs.existsSync(dir3)) {
                fs.writeFileSync(`./rank_data/${server}/${queue}/${division}/${queue}_${division}.json`, JSON.stringify(allData, null, 2), { flag: 'a' })
            } else if (fs.existsSync(dir1) && fs.existsSync(dir2) && !fs.existsSync(dir3)) {
                fs.mkdirSync(dir3)
                fs.writeFileSync(`./rank_data/${server}/${queue}/${division}/${queue}_${division}.json`, JSON.stringify(allData, null, 2), { flag: 'a' })
            } else if (fs.existsSync(dir1) && !fs.existsSync(dir2) && !fs.existsSync(dir3)) {
                fs.mkdirSync(dir2)
                fs.mkdirSync(dir3)
                fs.writeFileSync(`./rank_data/${server}/${queue}/${division}/${queue}_${division}.json`, JSON.stringify(allData, null, 2), { flag: 'a' })
            }

            clearInterval(interval)
        }
    }, limit)
}

async function getPlayerNames() {
    let names = []
    let data = euw1_platinum_1

    for (let r = 0; r < data.length; r++) {
        for (let d = 0; d < data[r].length; d++) {
            names.push(data[r][d].summonerName)
        }
    }
    return names
}

async function fetchSumByName(name) {
    let response;
    let data;
    while (name.includes(" ")) {
        let spacespot = name.indexOf(" ")
        name = name.substring(0, spacespot) + sp + name.substring(spacespot + 1)
    }

    let link = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?${riotKey}`

    try {
        response = await fetch(link)
        data = await response.json()
    } catch (err) {
    }
    return data
}

// getPuuids()
async function getPuuids() {
    let names = await getPlayerNames()
    let number = euw1_platinum_1_puuids.length

    let interval = setInterval(async function () {
        let accData = await fetchSumByName(names[number])
        if (accData.status === undefined) {
            if (accData.revisionDate > patchDate) {
                number += 1
                console.log(`${((number / names.length) * 100).toFixed(2)} % complete\nTime remaining: ${(((names.length - number) * 1.20) / 60).toFixed(0)} minutes\n`)

                const fileData = JSON.parse(fs.readFileSync('./rank_data/euw1/PLATINUM/I/puuids.json'))
                fileData.push(accData.puuid)
                fs.writeFileSync('./rank_data/euw1/PLATINUM/I/puuids.json', JSON.stringify(fileData, null, 2), { flag: 'a' })
            } else {
                console.log('xaxaax')
            }
        } else {
            number += 1
        }
    }, limit)
}

getMatchData()
async function getMatchData() {
    const idCheck = JSON.parse(fs.readFileSync('./rank_data/euw1/PLATINUM/I/games.json'))
    let id = idCheck[0][0]
    let match = 0
    let allData = []
    let link = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${euw1_platinum_1_puuids[id]}/ids?type=ranked&start=0&count=100&${riotKey}`

    response = await fetch(link)
    data = await response.json()
    let interval = setInterval(async function () {
        let link2 = `https://europe.api.riotgames.com/lol/match/v5/matches/${data[match]}?${riotKey}`

        response2 = await fetch(link2)
        data2 = await response2.json()

        if (data2.info !== undefined) {
            if (data2.info.gameCreation > patchDate) {
                match += 1
                let game = []
                for (let i = 0; i < data2.info.participants.length; i++) {
                    let participant = data2.info.participants[i]
                    let playerData = {
                        champLevel: `${participant.champLevel}`,
                        championName: `${participant.championName}`,
                        goldEarned: `${participant.goldEarned}`,
                        item0: `${participant.item0}`,
                        item1: `${participant.item1}`,
                        item2: `${participant.item2}`,
                        item3: `${participant.item3}`,
                        item4: `${participant.item4}`,
                        item5: `${participant.item5}`,
                        item6: `${participant.item6}`,
                        individualPosition: `${participant.individualPosition}`,
                        totalDamageDealtToChampions: `${participant.totalDamageDealtToChampions}`,
                        totalMinionsKilled: `${participant.totalMinionsKilled}`,
                        visionScore: `${participant.visionScore}`,
                        win: `${participant.win}`,
                    }
                    game.push(playerData)
                }
                const fileData = JSON.parse(fs.readFileSync('./rank_data/euw1/PLATINUM/I/games.json'))
                fileData.push(game)
                fs.writeFileSync(`./rank_data/euw1/PLATINUM/I/games.json`, JSON.stringify(fileData, null, 2))
                console.log(match, 'match')

            } else {
                id += 1
                match = 0
                link = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${euw1_platinum_1_puuids[id]}/ids?type=ranked&start=0&count=100&${riotKey}`

                response = await fetch(link)
                data = await response.json()
                console.log(id, 'id')

                const fileData = JSON.parse(fs.readFileSync('./rank_data/euw1/PLATINUM/I/games.json'))
                fileData[0][0] = id
                fs.writeFileSync(`./rank_data/euw1/PLATINUM/I/games.json`, JSON.stringify(fileData, null, 2))
            }
        } else {
            id += 1
            match = 0
            link = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${euw1_platinum_1_puuids[id]}/ids?type=ranked&start=0&count=100&${riotKey}`

            response = await fetch(link)
            data = await response.json()
            console.log(id, 'undefined')
        }
    }, limit)
}