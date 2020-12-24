import { BugSplat } from './bugsplat.ts';
import { TestSuite, test } from "https://deno.land/x/test_suite@v0.6.3/mod.ts";
import { stub, Stub } from "https://deno.land/x/mock@v0.9.4/mod.ts";
import { assertEquals } from "https://deno.land/std@0.80.0/testing/asserts.ts";

interface BugSplatSuiteContext {
    bugsplat: BugSplat;
    fetch: Stub<any>;
    formData: any;
    formDataValues: any;
}

const database = "fred";
const appName = "my-deno-crasher-test";
const appVersion = "1.0";
const fakeJson = async () => 'success!';

const bugSplatSuite: TestSuite<BugSplatSuiteContext> = new TestSuite({
    name: 'BugSplat',
    beforeEach(context: BugSplatSuiteContext) {
        context.fetch = stub(globalThis, 'fetch', [{
            status: 200,
            json: fakeJson
        }]);
        context.bugsplat = new BugSplat(database, appName, appVersion);
        context.formDataValues = [];
        context.formData = <any>{
            append: (key: any, value: any) => {
                context.formDataValues[key] = value;
            }
        };
        context.bugsplat.formData = () => context.formData;
    }
});

test(bugSplatSuite, 'post should call fetch with url, method and body', (context: BugSplatSuiteContext) => {
    const expectedUrl = `https://${database}.bugsplat.com/post/js/`;
    const error = new Error('BugSplat rocks');
    
    context.bugsplat.post(error);

    assertEquals(context.fetch.calls, [{
        args: [
            expectedUrl,
            {
                body: context.formData,
                method: 'POST'
            }
        ],
        returned: {
            status: 200,
            json: fakeJson
        }
    }]);
});