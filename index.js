const express = require('express');
const fetch = require('node-fetch');
const cheerio = require("cheerio");

const app = express();

app.use(express.json());

app.get("/api/v1/search", (req, res) => {
	const { query } = req.query;

	if(!query) {
		res.status(400).json({ error: "Query is required" });
		return;
	}

	fetch("https://sdarot.tw/ajax/index?search=" + query, {
		headers: {
			"referer": "https://sdarot.tw/",
		}
	}).then(response => response.json()).then(data => {
		res.status(200).json(data);
	});
});

app.get("/api/v1/getShow", (req, res) => {
	const { id } = req.query;

	if(!id) {
		res.status(400).json({ error: "Id is required" });
		return;
	}

	fetch("https://sdarot.tw/watch/" + id).then(async (response) => {
		if(response.url != "https://www.sdarot.tw/") {
			const html = await response.text();
			const $ = cheerio.load(html);

			const seasonsAmount = parseInt($("#season").children().length);
			const seasons = [];

			const infoContainer = $(".col-lg-3.col-md-4.col-sm-5.col-xs-12")

			for(let season = 1; season < seasonsAmount + 1; season++) {
				await fetch("https://sdarot.tw/ajax/watch?episodeList=" + id + "&season=" + season, {
					headers: {
						"referer": "https://sdarot.tw/",
					}
				}).then(response => response.text()).then(episodesHtml => {
					const page = cheerio.load(episodesHtml);

					seasons.push({
						season,
						episodes: page(".pointer").length
					})
				})
			}

			res.status(200).json({
				name: {
					english: $(".poster").children().first().children().first().find("span").html(),
					hebrew: $(".poster").children().first().children().first().children().first()[0].children[0].data.replace(" / ", "")
				},

				image: "https://static.sdarot.tw/series/" + id + ".jpg",
				years: infoContainer.children("div:nth-child(2)").find("div").find("span").html(),
				rating: +$(".rate")[0].children[0].data,
				ratedBy: +$(".ratedBy").children("span")[0].children[0].data.replaceAll(",", ""),
				views: +$(".stars").parent().children("div:nth-child(3)").children("p:nth-child(2)").text().replaceAll(",", ""),
				seasons,
			});
		} else {
			res.status(404).json({error: "Can't find this show"});
		}
	});
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});