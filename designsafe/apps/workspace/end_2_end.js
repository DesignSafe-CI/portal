import { Selector } from 'testcafe';
import { Role } from 'testcafe';

// const regularAccUser = Role('https://www.designsafe-ci.org/rw/workspace/#/', async t => {
//     await t
//         .typeText('#username', 'TestUser')
//         .typeText('#password', 'testpass')
//         .click('#login-btn');
// });

fixture `login`
    .page `https://agave.designsafe-ci.org/authenticationendpoint/login.do?forceAuth=false&passiveAuth=false&state=60cd6fda914e1ae634a04ffd5b65de46b61e6f741e1b6af1&sessionDataKey=6ac2eb1a-cfa9-4a60-a400-c10767c6de25&relyingParty=BhO6DMlp4gS2GeKKMFrfufbLz8Qa&type=oauth2&sp=TACC_ds_admin_DesignSafe-CI%20QA_PRODUCTION&isSaaSApp=false&authenticators=BasicAuthenticator:LOCAL`
    .httpAuth({
        username: 'username',
        password: 'password',
    });

test('login', async t => {
    //asks for seesion clookies before proceding to welcome
    // await t
    //  // Use the assertion to check if the actual header text is equal to the expected one
    //     .expect(Selector('.btn-group').innerText).eql('Welcome');
});

test
    .httpAuth({
        username:'differentUserName',
        password: 'differentPassword'
    })
    ('Test2', async t => {});


// fixture `Navigate to workspace`
//     .page `https://designsafeci-dev.tacc.utexas.edu/`;

// const researchWorkBench = Selector('.dropdown');
// const dropdownMenuWorkspace = researchWorkBench.find('li').withText('Workspace');
// // const simulationMenu = Selector('workspace-tab-title.ng-biding').withText('Simulation');

// test('Nativatetoworkspace', async t => {
//     await t
//         .click(researchWorkBench)
//         .click(dropdownMenuWorkspace)
//         .click(simulationMenu)

   
// });

// fixture `workspace`
//     .page `https://www.designsafe-ci.org/rw/workspace/#/`;

// const simulationMenu = Selector('workspace-tab-title.ng-biding').withText('Simulation');



// test('workspace', async t => {
//     await t
    
//         .click(simulationMenu)

   
// });


