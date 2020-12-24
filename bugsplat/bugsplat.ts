export class BugSplat {

    public formData = () => new FormData();

    private _database: string;
    private _appName: string;
    private _appVersion: string;
    private _appKey: string;
    private _description: string;
    private _email: string;
    private _user: string;

    constructor(database: string, appName: string, appVersion: string) {
        if (!database || database === '') {
            throw new Error('BugSplat error: no database was specified!');
        }
    
        if (!appName || appName === '') {
            throw new Error('BugSplat error: no appName was specified!');
        }
    
        if (!appVersion || appVersion === '') {
            throw new Error('BugSplat error: no appVersion was specified!');
        }
    
        this._database = database;
        this._appName = appName;
        this._appVersion = appVersion;
    
        this._appKey = '';
        this._description = '';
        this._email = '';
        this._user = '';
    }

    setDefaultAppKey(appKey: string) {
        this._appKey = appKey;
    }

    setDefaultDescription(description: string) {
        this._description = description;
    }

    setDefaultEmail(email: string) {
        this._email = email;
    }

    setDefaultUser(user: string) {
        this._user = user;
    }

    async post(errorToPost: Error, options?: BugSplatOptions) {
        options = options || {};

        const appKey = options.appKey || this._appKey;
        const user = options.user || this._user;
        const email = options.email || this._email;
        const description = options.description || this._description;
        const additionalFormDataParams = options.additionalFormDataParams || [];

        const url = `https://${this._database}.bugsplat.com/post/js/`;
        const callstack = !errorToPost.stack ? `${errorToPost?.toString()}` : errorToPost.stack;
        const method = 'POST';
        const body = this.formData();
        body.append('database', this._database);
        body.append('appName', this._appName);
        body.append('appVersion', this._appVersion);
        body.append('appKey', appKey);
        body.append('user', user);
        body.append('email', email);
        body.append('description', description);
        body.append('callstack', callstack);
        additionalFormDataParams.forEach(param => body.append(param.key, param.value));

        console.log('BugSplat Error:', errorToPost);
        console.log('BugSplat Url:', url);

        const response = await fetch(url, { method, body });
        const json = await this._tryParseResponseJson(response);

        console.log('BugSplat POST status code:', response.status);
        console.log('BugSplat POST response body:', json);

        if (response.status === 400) {
            return this._createReturnValue(new Error('BugSplat Error: Bad request'), json, errorToPost);
        }

        if (response.status === 429) {
            return this._createReturnValue(new Error('BugSplat Error: Rate limit of one crash per second exceeded'), json, errorToPost);
        }

        if (!response.ok) {
            return this._createReturnValue(new Error('BugSplat Error: Unknown error'), json, errorToPost);
        }

        return this._createReturnValue(null, json, errorToPost);
    }

    private _createReturnValue(error: Error | null, response: any, original: Error) {
        return {
            error,
            response,
            original
        };
    }

    private async _tryParseResponseJson (response: Response) {
        let parsed;
        try {
            parsed = await response.json();
        } catch (_) {
            parsed = {};
        }
        return parsed;
    }
};

interface FormDataParam {
    key: string;
    value: string | Blob;
}

interface BugSplatOptions {
    additionalFormDataParams?: Array<FormDataParam>;
    appKey?: string;
    description?:  string;
    email?: string;
    user?: string;
}