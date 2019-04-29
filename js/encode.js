/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 * Author: Jim Robinson
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


const EncodeDataSource = function (columnFormat) {
    this.columnFormat = columnFormat;
};

EncodeDataSource.prototype.retrieveData = async function (genomeID, filter) {

    const url = "https://s3.amazonaws.com/igv.org.app/encode/" + genomeID + ".txt.gz";

    let data;
    try {

        data = await igv.xhr.loadString(url, {});

        const records = parseTabData(data, filter);
        records.sort(encodeSort);
        return records;

    } catch (e) {

        console.error(e);
        return undefined;
    }

};

function parseTabData(data, filter) {

    var dataWrapper,
        line;

    dataWrapper = igv.getDataWrapper(data);

    let records = [];

    dataWrapper.nextLine();  // Skip header
    while (line = dataWrapper.nextLine()) {

        let tokens = line.split("\t");
        let record = {
            "Assembly": tokens[1],
            "ExperimentID": tokens[0],
            "Experiment": tokens[0].substr(13).replace("/", ""),
            "Cell Type": tokens[2],
            "Assay Type": tokens[3],
            "Target": tokens[4],
            "Format": tokens[8],
            "Output Type": tokens[7],
            "Lab": tokens[9],
            "url": "https://www.encodeproject.org" + tokens[10],
            "Bio Rep": tokens[5],
            "Tech Rep": tokens[6],
            "Accession": tokens[11]
        };
        constructName(record);

        if (filter === undefined || filter(record)) {
            records.push(record);
        }
    }

    return records;
}

function constructName(record) {

    let name = record["Cell Type"] || "";

    if (record["Target"]) {
        name += " " + record["Target"];
    }
    if (record["Assay Type"].toLowerCase() !== "chip-seq") {
        name += " " + record["Assay Type"];
    }
    if (record["Bio Rep"]) {
        name += " " + record["Bio Rep"];
    }
    if (record["Tech Rep"]) {
        name += (record["Bio Rep"] ? ":" : " 0:") + record["Tech Rep"];
    }

    name += " " + record["Output Type"];

    name += " " + record["Experiment"];

    record["Name"] = name;

}

function encodeSort(a, b) {
    var aa1,
        aa2,
        cc1,
        cc2,
        tt1,
        tt2;

    aa1 = a['Assay Type'];
    aa2 = b['Assay Type'];
    cc1 = a['Cell Type'];
    cc2 = b['Cell Type'];
    tt1 = a['Target'];
    tt2 = b['Target'];

    if (aa1 === aa2) {
        if (cc1 === cc2) {
            if (tt1 === tt2) {
                return 0;
            } else if (tt1 < tt2) {
                return -1;
            } else {
                return 1;
            }
        } else if (cc1 < cc2) {
            return -1;
        } else {
            return 1;
        }
    } else {
        if (aa1 < aa2) {
            return -1;
        } else {
            return 1;
        }
    }
}

EncodeDataSource.prototype.tableData = function (data) {
    var self = this,
        mapped;

    mapped = data.map(function (row) {

        let displayKeys = self.columnFormat.map(function (col) {
            return col.title
        });

        return displayKeys.map(function (key) {
            return row[key];
        })
    })

    return mapped;
};

EncodeDataSource.prototype.tableColumns = function () {
    return this.columnFormat;
};

EncodeDataSource.prototype.dataAtRowIndex = function (data, index) {


    let row = data[index];
    let format = getFormat(row);

    let type;
    if (format === 'bedpe-domain') {
        type = 'annotation';
    } else if (format === 'bedpe-loop') {
        type = 'interaction';
    }

    let obj =
        {
            url: row['url'],
            color: encodeAntibodyColor(row['Target']),
            name: row['Name'],
            format: format,
            type: type
        };

    return obj;

    function encodeAntibodyColor(antibody) {

        var colors,
            key;

        colors =
            {
                DEFAULT: "rgb(3, 116, 178)",
                H3K27AC: "rgb(200, 0, 0)",
                H3K27ME3: "rgb(130, 0, 4)",
                H3K36ME3: "rgb(0, 0, 150)",
                H3K4ME1: "rgb(0, 150, 0)",
                H3K4ME2: "rgb(0, 150, 0)",
                H3K4ME3: "rgb(0, 150, 0)",
                H3K9AC: "rgb(100, 0, 0)",
                H3K9ME1: "rgb(100, 0, 0)"
            };

        if (undefined === antibody || '' === antibody || '-' === antibody) {
            key = 'DEFAULT';
        } else {
            key = antibody.toUpperCase();
        }

        return colors[key];
    }

    function getFormat(row) {

        let format = row['Format'],
            outputType = row['Output Type'],
            assayType = row['Assay Type'];

        if (format === 'bedpe' && outputType && outputType.includes('domain')) {
            return 'bedpe-domain';
        } else if (format === 'tsv' && outputType.includes("interaction") && assayType.toLowerCase() === 'hic') {
            return "bedpe-loop";
        } else {
            return format.toLowerCase();
        }
    }
};


function urlString(assembly, fileFormat) {

    var str;

    // TODO - Test Error Handling with this URL.
    // str = "https://www.encodeproject.org/search/?type=experiment&assembly=/work/ea14/juicer/references/genome_collection/Hs2-HiC.chrom.sizes&files.file_format=bigWig&format=json&field=lab.title&field=biosample_term_name&field=assay_term_name&field=target.label&field=files.file_format&field=files.output_type&field=files.href&field=files.replicate.technical_replicate_number&field=files.replicate.biological_replicate_number&field=files.assembly&limit=all";

    str = "https://www.encodeproject.org/search/?" +
        "type=experiment&" +
        "assembly=" + assembly + "&" +
        //"files.file_format=" + fileFormat + "&" +
        "format=json&" +
        "field=lab.title&" +
        "field=biosample_term_name&" +
        "field=assay_term_name&" +
        "field=target.label&" +
        "field=files.file_format&" +
        "field=files.output_type&" +
        "field=files.href&" +
        "field=files.replicate.technical_replicate_number&" +
        "field=files.replicate.biological_replicate_number&" +
        "field=files.assembly&" +
        "limit=all";

    return str;
}

function parseJSONData(json, assembly, fileFormats) {

    let rows = [];

    json["@graph"].forEach(function (record) {

        var cellType,
            target,
            filtered,
            mapped,
            assayType;

        cellType = record.biosample_term_name;
        assayType = record.assay_term_name;
        target = record.target ? record.target.label : undefined;
        let id = record["@id"];

        if (record.files) {
            filtered = record.files.filter(function (file) {
                return assembly === file.assembly && (!fileFormats || fileFormats.has(file.file_format));
            });

            mapped = filtered.map(function (file) {

                var bioRep = file.replicate ? file.replicate.bioligcal_replicate_number : undefined,
                    techRep = file.replicate ? file.replicate.technical_replicate_number : undefined,
                    name = cellType || "";

                if (target) {
                    name += " " + target;
                }
                if (assayType && assayType.toLowerCase() !== "chip-seq") {
                    name += " " + assayType;
                }
                if (bioRep) {
                    name += " " + bioRep;
                }

                if (techRep) {
                    name += (bioRep ? ":" : " 0:") + techRep;
                }

                return {
                    "Assembly": file.assembly,
                    "ExperimentID": record['@id'],
                    "Cell Type": cellType || '',
                    "Assay Type": record.assay_term_name,
                    "Target": target || '',
                    "Lab": record.lab ? record.lab.title : "",
                    "Format": file.file_format,
                    "Output Type": file.output_type,
                    "url": "https://www.encodeproject.org" + file.href,
                    "Bio Rep": bioRep,
                    "Tech Rep": techRep,
                    "Name": name
                };

            });
        }

        Array.prototype.push.apply(rows, mapped);


    });

    return rows.map(function (row) {

        return Object.keys(row).map(function (key) {
            let val = row[key];
            return (undefined === val || '' === val) ? '-' : val;
        })

    });
}

export default EncodeDataSource


