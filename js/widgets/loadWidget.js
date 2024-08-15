import * as GooglePicker from '../../node_modules/google-utils/src/googleFilePicker.js'
import FileLoadManager from "./fileLoadManager.js"
import FileLoadWidget from "./fileLoadWidget.js"
import * as Utils from "./utils.js"
import AlertSingleton from "./alertSingleton.js"
import {createURLModalElement} from "./urlModal.js"

function createURLWidget(igvMain, urlModalId, urlModalTitle, loadHandler) {

    const urlModalElement = createURLModalElement(urlModalId, urlModalTitle)

    igvMain.appendChild(urlModalElement)

    const fileLoadWidgetConfig =
        {
            widgetParent: urlModalElement.querySelector('.modal-body'),
            dataTitle: urlModalTitle,
            indexTitle: 'Index',
            mode: 'url',
            fileLoadManager: new FileLoadManager(),
            dataOnly: true,
            doURL: true
        }

    const fileLoadWidget = new FileLoadWidget(fileLoadWidgetConfig)

    const urlModal = new bootstrap.Modal(urlModalElement)

    const urlModalHandler = async fileLoadWidget => {
        const paths = fileLoadWidget.retrievePaths()
        await loadHandler({url: paths[0]})
        return true
    }

    Utils.configureModal(fileLoadWidget, urlModal, urlModalHandler)

    return urlModal
}

function createLoadDropdown({ igvMain,
                            localFileInput,
                            initializeDropbox,
                            dropboxButton,
                            googleEnabled,
                            googleDriveButton,
                            urlModalId,
                            urlModalTitle,
                            loadHandler }) {

    // local file
    localFileInput.addEventListener('change', async () => {

        const {files} = localFileInput

        const paths = Array.from(files)

        localFileInput.value = ''

        await loadHandler({url: paths[0]})
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

                        loadHandler(configList[0])
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
                await loadHandler({url: paths[0]})
            }

            GooglePicker.createDropdownButtonPicker(false, filePickerHandler)
        })
    }

    // URL
    return createURLWidget(igvMain, urlModalId, urlModalTitle, loadHandler)

}

export { createLoadDropdown }
