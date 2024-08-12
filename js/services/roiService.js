import {igvxhr} from "../../node_modules/igv-utils/src/index.js"
import FileLoadManager from "../widgets/fileLoadManager.js"
import FileLoadWidget from "../widgets/fileLoadWidget.js"
import * as Utils from "../widgets/utils.js"
import AlertSingleton from "../widgets/alertSingleton.js"
import * as GooglePicker from '../../node_modules/google-utils/src/googleFilePicker.js'

let roiURLModal
function createROIURLWidget(urlModalId, igvMain, roiFileLoadHandler) {

    const html =
        `<div id="${urlModalId}" class="modal fade" tabindex="-1">

        <div class="modal-dialog modal-lg">
    
            <div class="modal-content">
    
                <div class="modal-header">
                    <div class="modal-title">ROI URL</div>
    
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    
                </div>
    
                <div class="modal-body">
                </div>
    
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">OK</button>
                </div>
    
            </div>
    
        </div>

    </div>`

    const fragment = document.createRange().createContextualFragment(html)
    const urlModalElement = fragment.firstChild

    igvMain.appendChild(urlModalElement)

    const fileLoadWidgetConfig =
        {
            widgetParent: urlModalElement.querySelector('.modal-body'),
            dataTitle: 'ROI',
            indexTitle: 'Index',
            mode: 'url',
            fileLoadManager: new FileLoadManager(),
            dataOnly: true,
            doURL: true
        }

    const fileLoadWidget = new FileLoadWidget(fileLoadWidgetConfig)

    roiURLModal = new bootstrap.Modal(urlModalElement)
    Utils.configureModal(fileLoadWidget, roiURLModal, async fileLoadWidget => {
        const paths = fileLoadWidget.retrievePaths()
        await roiFileLoadHandler({url: paths[0]})
        return true
    })
}

function createROIMenu(browser,
                       igvMain,
                       localFileInput,
                       initializeDropbox,
                       dropboxButton,
                       googleEnabled,
                       googleDriveButton,
                       urlModalId) {


    const roiFileLoadHandler = async ({ url }) => {
        try {
            const roi = await igvxhr.loadJson(url)
            roi.isUserDefined = true
            browser.roiManager.loadROI(roi)
        } catch (e) {
            console.error(e)
            AlertSingleton.present(e)
        }
    }

    // local file
    localFileInput.addEventListener('change', async () => {

        const {files} = localFileInput

        const paths = Array.from(files)

        localFileInput.value = ''

        await roiFileLoadHandler({url: paths[0]})
    })

    //  Dropbox
    if (dropboxButton) dropboxButton.addEventListener('click', async () => {

        const result = await initializeDropbox()

        if (true === result) {

            const obj =
                {
                    success: dbFiles => {

                        const configList = dbFiles.map(({link}) => {
                            return {url: link}
                        })

                        roiFileLoadHandler(configList[0])
                    },
                    cancel: () => {
                    },
                    linkType: "preview",
                    multiselect: false,
                    folderselect: false,
                }

            Dropbox.choose(obj)

        } else {
            AlertSingleton.present('Cannot connect to Dropbox')
        }
    })

    // Google Drive
    if (!googleEnabled) {
        googleDriveButton.parentElement.style.display = 'none'
    } else {

        googleDriveButton.addEventListener('click', () => {

            const filePickerHandler = async responses => {
                const paths = responses.map(({url}) => url)
                await roiFileLoadHandler({url: paths[0]})
            }

            GooglePicker.createDropdownButtonPicker(false, filePickerHandler)
        })

    }

    // URL
    createROIURLWidget(urlModalId, igvMain, roiFileLoadHandler)

}

export { createROIMenu }
