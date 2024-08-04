import { UsersTestingUtil } from '../../testing/utils/users-testing.util';

describe('UsersComponent', () => {
  let util: UsersTestingUtil;

  beforeEach(async () => {
    util = new UsersTestingUtil();
    await util.compileComponent();
  });

  it('displays a correct list of columns', async () => {
    const columnTitles = await util.usersHarness.getColumnTitles();
    expect(columnTitles).toEqual(['Id', 'Name', 'Username', 'Email', '']);
  });

  it('displays the users data', async () => {
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);

    const firstRowData = await util.usersHarness.getCellsDataForRow(0);
    const secondRowData = await util.usersHarness.getCellsDataForRow(1);

    expect(firstRowData).toEqual(['0', 'api-name1', 'api-username1', 'api-email1@test.com', 'Edit']);
    expect(secondRowData).toEqual(['1', 'api-name2', 'api-username2', 'api-email2@test.com', 'Edit']);
  });

  it('makes the row editable when you click the "edit" button', async () => {
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);

    await util.usersHarness.enableRowEditing(0);
    expect(await util.usersHarness.isRowEditable(0)).toBe(true);
    expect(await util.usersHarness.isRowEditable(1)).toBe(false);
  });

  it('displays the values for the editable row', async () => {
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);

    await util.usersHarness.enableRowEditing(0);
    const values = await util.usersHarness.getInputValuesForRow(0);
    const { name, username, email } = UsersTestingUtil.twoUsersList[0];
    expect(values).toEqual([name, username, email]);
  });

  it('updates the user when edited data is saved', async () => {
    const updatedUserIndex = 0;
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);
    const [newName, newUsername, newEmail] = ['updated name', 'updated username', 'updated@test.com'];

    await util.usersHarness.enableRowEditing(updatedUserIndex);
    await util.usersHarness.setInputValuesForRow(updatedUserIndex, [newName, newUsername, newEmail]);
    await util.usersHarness.saveRowChanges(updatedUserIndex);

    await util.mockUpdateUserCall(UsersTestingUtil.twoUsersList[updatedUserIndex].id, {
      id: UsersTestingUtil.twoUsersList[updatedUserIndex].id,
      name: newName,
      username: newUsername,
      email: newEmail
    });
    const firstRowData = await util.usersHarness.getCellsDataForRow(updatedUserIndex);
    const secondRowData = await util.usersHarness.getCellsDataForRow(1);

    expect(firstRowData).toEqual(['0', newName, newUsername, newEmail, 'Edit']);
    expect(secondRowData).toEqual(['1', 'api-name2', 'api-username2', 'api-email2@test.com', 'Edit']);
  });

  it('makes all rows editable when you click the "edit all" button', async () => {
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);

    await util.usersHarness.enableTableEditing();
    expect(await util.usersHarness.isRowEditable(0)).toBe(true);
    expect(await util.usersHarness.isRowEditable(1)).toBe(true);
  });

  it('displays the values for the editable row', async () => {
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);

    await util.usersHarness.enableTableEditing();
    let values = await util.usersHarness.getInputValuesForRow(0);
    const { name: name1, username: username1, email: email1 } = UsersTestingUtil.twoUsersList[0];
    expect(values).toEqual([name1, username1, email1]);

    values = await util.usersHarness.getInputValuesForRow(1);
    const { name: name2, username: username2, email: email2 } = UsersTestingUtil.twoUsersList[1];
    expect(values).toEqual([name2, username2, email2]);

  });

  it('updates users when edited data is saved', async () => {
    await util.mockUsersCall(UsersTestingUtil.twoUsersList);

    await util.usersHarness.enableTableEditing();

    const [newName1, newUsername1, newEmail1] = ['updated name 1', 'updated username 1', 'updated1@test.com'];
    const [newName2, newUsername2, newEmail2] = ['updated name 2', 'updated username 2', 'updated2@test.com'];

    await util.usersHarness.setInputValuesForRow(0, [newName1, newUsername1, newEmail1]);
    await util.usersHarness.setInputValuesForRow(1, [newName2, newUsername2, newEmail2]);
    await util.usersHarness.saveAllChanges();

    await util.mockBulkEditCall({
      0: {
        id: UsersTestingUtil.twoUsersList[0].id,
        name: newName1,
        username: newUsername1,
        email: newEmail1
      },
      1: {
        id: UsersTestingUtil.twoUsersList[1].id,
        name: newName2,
        username: newUsername2,
        email: newEmail2
      }
    });

    const firstRowData = await util.usersHarness.getCellsDataForRow(0);
    const secondRowData = await util.usersHarness.getCellsDataForRow(1);

    expect(firstRowData).toEqual(['0', newName1, newUsername1, newEmail1, 'Edit']);
    expect(secondRowData).toEqual(['1', newName2, newUsername2, newEmail2, 'Edit']);


  });
})
;
