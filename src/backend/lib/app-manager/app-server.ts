import { UdpServer } from "..";
import { UserSettings } from "../../../shared/models";
import { AppUserInterface } from "./app-user-interface";
import { ControllerMaster } from "../../../controller-api";

/**
 * App module responsible for server and controller logic.
 */
export class AppServer {
    /**
     * Instance of `UdpServer`.
     */
    public serverInstance: UdpServer;

    /**
     * Instance of `DualshockLikeController`.
     */
    public controllerMaster = new ControllerMaster();

    /**
     * @param ui User interface module.
     */
    constructor(private ui: AppUserInterface) {
        this.serverInstance = new UdpServer(this.controllerMaster);
    }

    /**
     * Start UDP server with provided settings.
     * @param settings Settings to be used to start UDP server.
     */
    public async start(settings: UserSettings["server"]) {
        await this.serverInstance.start(settings.port, settings.address);
        this.controllerMaster.startAutoScanning();
        this.controllerMaster.onListChange.subscribe(({addedControllers, removedControllers})=>{
            for (const controller of addedControllers){
                this.serverInstance.addController(controller)
            }
            for (const controller of removedControllers){
                this.serverInstance.removeController(controller)
            }
        })
        this.ui.tray.setToolTip(`Server@${settings.address}:${settings.port}`);
    }

    /**
     * Prepare for app exit.
     */
    public async prepareToExit() {
        await this.serverInstance.stop();
        this.serverInstance.removeController();
        this.controllerMaster.stopAutoScanning();
    }
}
