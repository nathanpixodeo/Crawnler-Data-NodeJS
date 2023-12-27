var express = require('express');
var router = express.Router();
const requestDOM = require('../helpers/requester');
const { getPostFromPage, getDetailPost } = require('../helpers/domUntils');
const cheerio = require('cheerio');
var router = express.Router();
var postModel = require('../models/postModel');
const origin = 'https://lichngaytot.com';

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' });
});

router.get('/getListTop', async (req, res, next) => {
	let array_name = [];
	const domHtml = await requestDOM(origin);
	// Load Dom 
	const $ = cheerio.load(domHtml);
	$('.nav-main ul.main-content>li').each(async (index, element) => {
		const name = $(element).find('a').eq(0).text();
		const link = $(element).find('a').eq(0).attr('href');
		let arrTmp = {
			name: name,
			path: link
		}
		array_name.push(arrTmp);
	});
	return res.send({ error: false, data: array_name, message: 'Success' });
});

router.get('/getPostListByPath', async (req, res, next) => {
	let { path, start, end } = req.query;
	let arrPost = []
	if (path) {		
		const domHtml = await requestDOM(origin + path);
		let $ = cheerio.load(domHtml);
		if ($('.pagination').length && $('.pagination a.pagination-pages').length > 1) {
			// Loop to get post all page
			let allProcess = [];
			for (let i = (start - 1); i < end; i++) {
				let newPath = path;
				if (i > 0) {
					newPath = path.replace(".html", "-p" + i + ".html");
				}
				console.log(newPath);
				let domPaging = await requestDOM(origin + newPath);
				allProcess.push(getPostFromPage(domPaging));
			}
			Promise.all(allProcess).then((values) => {
				let result = values.reduce((res, elem) => {
					return res = res.concat(elem);
				});
				return res.send(result);
			});
		} else {
			let postList = await getPostFromPage(domHtml);
			return res.send(postList);
		}
	}
});

router.post('/importPostByList', async (req, res, next) => {
	const postList = JSON.parse(req.body.postList);
	const news_type_id = req.body.news_type_id;
	let allProcess = [];
	for (const post of postList) {
		postModel.checkExistRefPath(post.path, async (err, res) => {
			if (err) {
				console.log(err);
				return;
			} else {
				if (res.length === 0) {
					let domPost = await requestDOM(origin + post.path);
					allProcess.push(getDetailPost(domPost, news_type_id, post.thumbnail, post.path));
				}
			}
		});
	}
	Promise.all(allProcess).then((values) => {
		return res.send({ error: false, message: 'Success' });
	});

});

module.exports = router;
