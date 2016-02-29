var DataPlugger = require('dataplugger');
var fs = require('fs');
var _ = require('underscore');
var Download = require('download');
var async = require('async');

var attachmentRegex = /https?:\/\/fieldbook.com\/attachments/g;
var opts = {};

function getBook(bookId, cb) {
    var dataplugger = new DataPlugger({
        'fieldbook' : {
            book : bookId
        }
    });

    dataplugger.setDefaultPlug('fieldbook');

    dataplugger.load(cb);
}

function downloadMediaFromRecords(records, finalCallback) {
    var downloads = [];

    console.log("Downloading media records");

    records.forEach((record) => {
        _.each(record, (val, key) => {
            if (attachmentRegex.test(val)) {
                downloads.push(function(callback) {
                    var filename = val.split('/').slice(-2).join('-');
                    new Download().get(val).dest(opts.mediaPath).rename(filename).run(() => {
                        console.log("Downloaded " + filename);
                        callback();
                    });
                    record[key] = 'media/' + filename;
                });
            }
        });
    });

    console.log(downloads.length + " images found");

    async.parallel(downloads, finalCallback);
}

function download(userOpts) {
    opts = userOpts;

    console.log("Getting " + opts.bookId);

    getBook(opts.bookId, (book) => {
        console.log("Got book");

        async.each(_.values(book), downloadMediaFromRecords, () => {
            fs.writeFile(opts.dataPath, JSON.stringify(book,null,4), 'utf-8', () => {
                console.log("Written JSON file");
                opts.callback();
            });
        });
    });
}

module.exports = download;