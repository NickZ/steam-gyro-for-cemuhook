import { Subject, Observable, Subscription } from "rxjs";
import { Filter, privateData } from "../lib";
import { MotionData, MotionDataWithTimestamp, TypedFilterData } from "../models";
import {
    DualshockData,
    DualshockMeta,
    DualshockReport,
    GenericDevice,
} from "../models";

/**
 * Internal class data interface.
 */
export interface InternalData{
    dualshockDataSubject: Subject<DualshockData>;
    errorSubject: Subject<Error>;
    motionDataSubject: Subject<MotionDataWithTimestamp>;
    openCloseSubject: Subject<boolean>;
    reportSubject: Subject<MotionDataWithTimestamp>;
}

/**
 * Private data getter.
 */
const getInternals = privateData() as (self: GenericController<MotionDataWithTimestamp>, init: InternalData | void) => InternalData;

/**
 * Class wrapper for handling various controllers as Dualshock compatible.
 */
export abstract class GenericController<R extends MotionDataWithTimestamp> {

    /**
     * Currently open device.
     */
    public abstract device: GenericDevice<R>;

    /**
     * Current id.
     */
    public abstract id: number;

    /**
     * GenericSteamDevice's event subscriptions.
     */

    protected autoreconnect:boolean = false;

    protected previouslyOpened:boolean = false;

    /**
     * GenericSteamDevice's event subscriptions.
     */
    protected deviceEvents = new Subscription();

    /**
     * Instance of filter.
     */
    protected filter: Filter = new Filter();
    
    public setData(getInternalsfn: Function = getInternals){
        const pd = getInternalsfn(this, {
            dualshockDataSubject: new Subject(),
            errorSubject: new Subject(),
            motionDataSubject: new Subject(),
            openCloseSubject: new Subject(),
            reportSubject: new Subject(),
        });
        this.device!.onError.subscribe((value) => pd.errorSubject.next(value));
        this.device!.onMotionsData.subscribe((value) => pd.motionDataSubject.next(value));
        this.device!.onOpenClose.subscribe((value) => pd.openCloseSubject.next(value));
        this.device!.onReport.subscribe((value) => {
            const output = this.filter.setInput(value).filter(50000).getOutput();
            let meta: DualshockMeta | null;
            let report: DualshockReport | null;

            value = { ...value, ...output };
            pd.reportSubject.next(value);

            meta = this.device!.reportToDualshockMeta(value, this.id);
            report = this.device!.reportToDualshockReport(value);

            if (report !== null && meta !== null) {
                pd.dualshockDataSubject.next({ meta, report });
            }
        });
    }

    public get report() {
        return this.device!.isOpen() ? this.device!.report : null;
    }

    public get motionData() {
        return this.device!.isOpen() ? this.device!.motionData : null;
    }
    public get isAutoReconnect(): boolean{
        if(this.autoreconnect){
            return true;
        }
        return false;
    }
    public abstract readonly controllerType: string
    public abstract readonly deviceType: string
    /**
     * Returns observable for new reports.
     */
    public abstract readonly onReport: Observable<R>;

    /**
     * Returns observable for new motion data.
     */
    public abstract readonly onMotionsData: Observable<MotionDataWithTimestamp>;

    /**
     * Returns observable for errors.
     */
    public abstract readonly onError: Observable<Error>;

    /**
     * Returns observable for open and close events.
     */
    public abstract readonly onOpenClose: Observable<boolean>;

    /**
     * Returns observable for open and close events.
     */
    public abstract readonly onDualshockData: Observable<DualshockData>;

    public reportToDualshockReport(report: R) {
        return this.isOpen() ? this.device!.reportToDualshockReport(report) : null;
    }

    public reportToDualshockMeta(report: R, padId: number) {
        return this.isOpen() ? this.device!.reportToDualshockMeta(report, padId) : null;
    }

    public abstract async open(options?:{autoreconnect?: boolean}): Promise<this>;
    public abstract async close(): Promise<this>;

    public isOpen() {
        return this.device!.isOpen();
    }

    public setFilter(data: TypedFilterData) {
        this.filter.setFilter(data);
    }

    public get dualShockMeta() {
        return this.isOpen() ? this.device.reportToDualshockMeta(this.device.report!, this.id) : null;
    }

    public get dualShockReport() {
        return this.isOpen() ? this.device.reportToDualshockReport(this.device.report!) : null;
    }
}
