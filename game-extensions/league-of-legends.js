const User = require("../models/user");
const request = require("request");
const co = require("co");

const apiKey = "7022e958-6a38-4858-8102-f4ced9df8b03";

// Summoner icon
// https://avatar.leagueoflegends.com/EUW/Sylror.png

const apiHandler = {
	getSummonerByName: name => {
		return new Promise((resolve, reject) => {
			const apiRequestUrl = `https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/by-name/${name}?api_key=${apiKey}`;

			request(apiRequestUrl,
				(err, res, body) => {
					if (err) {
						reject(err);
						return;
					}
					const data = JSON.parse(body);

					// Is the not summoner found?
					if (data.status && data.status.status_code == 404) {
						reject(data.status);
						return;
					}

					const summoner = data[name.replace(/\s+/g, "")];
					resolve(summoner);
				});
		});
	},
	getRunesBySummonerId: id => {
		return new Promise((resolve, reject) => {
			const apiRequestUrl = `https://euw.api.pvp.net/api/lol/euw/v1.4/summoner/${id}/runes?api_key=${apiKey}`;
			request(apiRequestUrl,
				(err, res, body) => {
					if (err) {
						reject(err);
						return;
					}
					const data = JSON.parse(body);
					// Is the not summoner found?
					if (data.status && data.status.status_code == 404) {
						reject(data.status);
						return;
					}

					const runes = data[id].pages;
					resolve(runes);
				});
		});
	}
};

module.exports = {
	shortname: "league-of-legends",
	name: "League of Legends",
	backgroundUrl: "/public/images/game-extensions/league-of-legends/background.jpg",
	wallpaperUrl: "/public/images/game-extensions/league-of-legends/wallpaper.jpg",
	description:
		"League of Legends is a fast-paced, competitive online game that blends the speed and intensity of an RTS with RPG elements. Two teams of powerful champions, each with a unique design and playstyle, battle head-to-head across multiple battlefields and game modes.",
	joinGameFormTemplate: `
		<p>Om te registreren moet je een runepage "DaVinciTournament" als naam geven. Als wij hebben gevalideerd dat dit jouw account is kan je het weer veranderen.</p>
		<!--<img ng-init="summonerIconUrl = 'https://avatar.leagueoflegends.com/EUW/' + joinGameParameters.summonerName + '.png';"  ng-src="{{ summonerIconUrl }}" />-->
		<p>Summoner Name:</p>
		<input class="form-control" type="text" ng-model="joinGameParameters.summonerName" ng-change="summonerIconUrl = 'https://avatar.leagueoflegends.com/EUW/' + joinGameParameters.summonerName + '.png';" />
		<!--<p style="color: red;" ng-show="lastResult.data == 'userHasNotPerformedAction'">Je moet eerst je runepage "DaVinciTournament" als naam geven.</p>
		<p style="color: green; ng-show="lastResult.data.name">Account is gekoppeld!</p>-->
	`,
	joinGameSubmit: form => {
		return new Promise((resolve, reject) => {
			co(function* () {
				const summonerName = form.summonerName;
				console.log(summonerName);
				if (summonerName == undefined) {
					reject("reload");
					return;
				}
				if (summonerName == "") {
					return;
				}
				const summoner = yield apiHandler.getSummonerByName(summonerName);
				const runes = yield apiHandler.getRunesBySummonerId(summoner.id);
				runes.forEach(runePage => {
					if (runePage.name.toLowerCase() == "davincitournament") {
						console.log(`Summoner ${summoner.name} has successfully connected his account`);
						resolve(summoner);
					}
				});

				reject("userHasNotPerformedAction");
			}).catch(err => {
				console.log(err);
				reject(err);
			});
		});
	}
};