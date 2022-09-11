import juicebox from '../../node_modules/juicebox.js/js/index.js'
import { EventBus } from '../../node_modules/igv-widgets/dist/igv-widgets.js'
import {makeDraggable,StringUtils} from '../../node_modules/igv-utils/src/index.js'
import {igvLocusChange, juiceboxLocusChange} from './locusChange.js'
import juiceboxCrosshairsHandler from './juiceboxCrosshairs.js'
import configureContactMapLoaders from './contactMapLoad.js'
import { throttle } from '../utils.js'
import ContactProjectionDatasource from "./contactProjectionDatasource.js"
import {loadIGVTrack} from '../app.js'

class JuiceboxPanel {
    constructor(config) {

        this.config = config

        const dragHandle = config.panel.querySelector('.spacewalk_card_drag_container')
        makeDraggable(config.panel, dragHandle)

        this.container = config.panel.querySelector('#spacewalk_juicebox_root_container')

        const button = config.panel.querySelector('#juicebox-panel-dismiss-button')
        button.addEventListener('click', e => this.dismiss())

    }

    async initialize() {

        this.browser = await juicebox.init(this.container, this.config)

        const $dropdowns = $('a[id$=-map-dropdown]').parent()

        const contactMapLoadConfig =
            {
                // Juicebox browser
                hicBrowser: this.browser,

                // IGV browser
                igvBrowser: this.config.igvBrowser,

                // Root juicebox element
                rootContainer: document.querySelector('#hic-main'),

                // Contact and Control dropdown elements
                $dropdowns,

                // Juicebox Archive maps
                dataModalId: 'hic-contact-map-modal',

                // ENCODE maps
                encodeHostedModalId: 'hic-encode-hosted-contact-map-modal',

                // Local maps
                $localFileInputs: $dropdowns.find('input'),

                // Dropbox maps
                $dropboxButtons: $dropdowns.find('div[id$="-map-dropdown-dropbox-button"]'),

                // Google Drive maps
                $googleDriveButtons: $dropdowns.find('div[id$="-map-dropdown-google-drive-button"]'),
                googleEnabled: this.config.googleEnabled || false,

                // URL maps
                urlLoadModalId: 'hic-load-url-modal',

                //
                mapMenu: this.config.mapMenu,
            };

        configureContactMapLoaders(contactMapLoadConfig)

        configurePercentileThresholdInput(this.config.percentileThresholdInput, this.config.igvBrowser)

        configureAlphaModifierInput(this.config.alphaModifierInput, this.config.igvBrowser)

        configureOffDiagonalBinThresholdInput(this.config.offDiagonalBinThresholdInput, this.config.igvBrowser)

        this.config.igvBrowser.on('locuschange', throttle(igvLocusChange(this.browser, this.config.igvBrowser), 100))

        this.browser.eventBus.subscribe("LocusChange", throttle(juiceboxLocusChange(this.browser, this.config.igvBrowser), 1000))

        this.browser.eventBus.subscribe("MapLoad", event => {
            console.log(`${ Date.now() } JuiceboxPanel - jb fired MapLoad event`)
            loadIGVTrack(this.browser, this.config.igvBrowser)
        })

        this.browser.setCustomCrosshairsHandler(juiceboxCrosshairsHandler(this.browser, this.config.igvBrowser))

    }

    createIGVConfiguration(hicBrowser, igvBrowser, genome, type) {

        const featureSource = new ContactProjectionDatasource(hicBrowser, igvBrowser.genome)

        if ('session' === type) {

            const session =
                {
                    genome,
                    tracks:
                        [
                            {
                                id: "jb-interactions",
                                type: "interact",
                                name: "Contacts",
                                height: 125,
                                featureSource
                            }
                        ]
                };

            return session

        } else {

            const track =
                {
                    id: "jb-interactions",
                    type: "interact",
                    name: "Contacts",
                    height: 125,
                    featureSource
                };

            return track
        }

    }

    toggle() {
        'block' === this.config.panel.style.display ? this.dismiss() : this.present()
    }

    present() {
        this.config.panel.style.left = `128px`
        this.config.panel.style.top = `128px`
        this.config.panel.style.display = 'block'
        EventBus.globalBus.post({ type: "DidPresentJuiceboxPanel", data: this })
    }

    dismiss() {
        this.config.panel.style.display = 'none'
        this.config.panel.style.left = `-1000px`
        this.config.panel.style.top = `-1000px`
        EventBus.globalBus.post({ type: "DidDismissJuiceboxPanel", data: this })
    }

    async loadSession(session) {

        juicebox.processSession(session)

        await this.browser.init(session)

    }

}

function configurePercentileThresholdInput(inputElement, igvBrowser){

    inputElement.addEventListener('input', e => {
        document.querySelector('#igv-juicebox-percentile-threshold-output').innerHTML = e.currentTarget.value
    })

    inputElement.addEventListener('mouseup', e => {
        console.log(`percentile threshold ${ e.currentTarget.value }`)
        updateTrack(igvBrowser)
    })

}

function configureAlphaModifierInput(inputElement, igvBrowser){

    inputElement.addEventListener('input', e => {
        document.querySelector('#igv-juicebox-alpha-modifier-output').innerHTML = e.currentTarget.value
    })

    inputElement.addEventListener('mouseup', e => {
        console.log(`alpha modifier ${ e.currentTarget.value }`)
        updateTrack(igvBrowser)
    })

}

function configureOffDiagonalBinThresholdInput(inputElement, igvBrowser){

    inputElement.addEventListener('keyup', e => {

        if (13 === e.keyCode) {
            console.log(`diagonal bin threshold ${ e.currentTarget.value }`)
            updateTrack(igvBrowser)
        }

    })
}

function updateTrack(igvBrowser) {

    const [ interactionTrack ] = igvBrowser.findTracks('id', 'jb-interactions')
    if (interactionTrack) {
        interactionTrack.updateViews()
    }

}

export default JuiceboxPanel
