var fs = require('fs');
const client = require('http');
const cheerio = require('cheerio');
const axios = require("axios");
const postModel = require('../models/postModel');
const searchAndRemoveString = require('./dataFilter');
const { imageToBase64 } = require('./Utils');

const getPostFromPage = (dom) => {
    return new Promise(function (resolve, reject) {
        let arrPost = [];
        let $c = cheerio.load(dom);
        if ($c('.content-left .other-news').length > 0) {
            $c('.content-left .other-news').each((index, element) => {
                let namePost = $c(element).find('.post-title4 a,.post-title a,.post-title3 a').eq(0).text();
                let linkPost = $c(element).find('.post-title4 a,.post-title a,.post-title3 a').eq(0).attr('href');
                let thumbElement = $c(element).find('img').eq(0);
                let thumbPost = "";
                if (thumbElement.attr('data-src')) {
                    thumbPost = thumbElement.attr('data-src');
                } else {
                    thumbPost = thumbElement.attr('src');
                }
                arrPost.push({
                    name: namePost,
                    path: linkPost,
                    thumbnail: thumbPost,
                });
            });
            // Add Box Category Grid
            if ($c('.cat-box-content .grid_colum_item').length > 0) {
                $c('.cat-box-content .grid_colum_item').each((index, eleChild) => {
                    let namePostGrid = $c(eleChild).find('.post-title4 a,.post-title a,.post-title3 a').eq(0).text();
                    let linkPostGrid = $c(eleChild).find('.post-title4 a,.post-title a,.post-title3 a').eq(0).attr('href');
                    let thumbPostGrid = $c(eleChild).find('img').eq(0);
                    let thumbPost = "";
                    if (thumbPostGrid.attr('data-src')) {
                        thumbPost = thumbPostGrid.attr('data-src');
                    } else {
                        thumbPost = thumbPostGrid.attr('src');
                    }
                    arrPost.push({
                        name: namePostGrid,
                        path: linkPostGrid,
                        thumbnail: thumbPost,
                    });
                });

            }
            resolve(arrPost);
        } else {
            resolve([]);
        }
    });

}

const getDetailPost = (dom, news_type_id, thumbnail, ref_path) => {
    return new Promise(async function (resolve, reject) {
        let $p = cheerio.load(dom);
        let title = "";
        let intro = "";
        let content = "";
        if ($p('.article').length > 0) {
            content = $p('.article .entry');
            title = $p('.article .article-title').text();
            intro = $p('.article .entry .article-sapo').text();
        } else {
            content = $p('.content-left .entry');
            title = $p('.content-left .page-head-title').text();
            intro = $p('.content-left .article-sapo').text();
        }
        // Remove Link
        content.find('a').contents().unwrap();
        // Remove Ads
        content.find('.advbox2').remove();
        content.find('.advbox').remove();
        content.find('.uk-player').remove();
        // Remove Script JS
        content.find('script').remove();
        // Remove Ads video
        content.find('#adbro').remove();
        // Process Download Images           
        let extension = thumbnail.split('.').pop();
        let file_name = new Date().getTime() + "." + extension;
        let image_path = "";

        // Process Post Data Import
        downloadImage(thumbnail.replace('https:','http:'), "assets/" + file_name)
            .then(async () => {
                console.log("Download Images Completed!!");
                let imageBase64 = await imageToBase64("assets/" + file_name);
                const config = {
                    url: 'http://172.105.120.33:3014/v1/front/news/uploadImage',
                    json: {
                        "image": imageBase64
                    }
                }
                const { data } = await axios.post(config.url, config.json);
                if (data.success) {
                    console.log("Upload Images Success", data);
                    image_path = data.url;
                    // Upload Images Success => Init Post Data and Insert
                    const dataPost = {
                        title: await searchAndRemoveString(title),
                        category: 1,
                        intro: await searchAndRemoveString(intro),
                        image: image_path,
                        thumbnail: thumbnail,
                        content: await searchAndRemoveString(content.html()),
                        status: 2,
                        publish_date: "",
                        view: 0,
                        order: 0,
                        meta_keyword: await searchAndRemoveString($p('meta[name=keywords]').attr('content')),
                        meta_desciption: await searchAndRemoveString($p('meta[name=description]').attr('content')),
                        created_by: 1,
                        updated_by: 1,
                        created_at: null,
                        updated_at: null,
                        news_type_id: news_type_id,
                        ref_path: ref_path,
                        insertDB: false
                    };

                    postModel.addPost(dataPost, function (err, message) {
                        if (err) {
                            console.log(message);
                            dataPost.insertDB = false;
                            resolve(dataPost);
                        } else {
                            console.log(message);
                            dataPost.insertDB = true;
                            resolve(dataPost);
                        }
                    });
                } else {
                    resolve();
                }
            })
            .catch(console.error);

    });
}


const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

module.exports = {
    getPostFromPage,
    getDetailPost
}