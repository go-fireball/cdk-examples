import {IBase} from "./i-base";

export interface IEnvironmentConfig extends IBase {

    environment: string;
    deleteProtection: boolean;
    appName: string;
    account?: string;
    region?: string;
    vpcId: string;
    // dbConfig: IDatabaseConfig;
    // alertSubscriptions: IAlertConfig;
}