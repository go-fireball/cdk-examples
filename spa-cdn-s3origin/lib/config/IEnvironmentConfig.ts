import {IBase} from "./IBase";
import {IAppDomains} from "./IAppDomains";

export interface IEnvironmentConfig extends IBase {
    environment: string;
    deleteProtection: boolean;
    appName: string;
    account?: string;
    region?: string;
    vpcId: string;
    // domains: IAppDomains;
}
