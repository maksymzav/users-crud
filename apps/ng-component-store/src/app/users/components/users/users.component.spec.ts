import {UsersTestingUtil} from '../../testing/utils/users-testing.util';

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
    const {name, username, email} = UsersTestingUtil.twoUsersList[0];
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
      email: newEmail,
    })
    const firstRowData = await util.usersHarness.getCellsDataForRow(updatedUserIndex);
    const secondRowData = await util.usersHarness.getCellsDataForRow(1);

    expect(firstRowData).toEqual(['0', newName, newUsername, newEmail, 'Edit']);
    expect(secondRowData).toEqual(['1', 'api-name2', 'api-username2', 'api-email2@test.com', 'Edit']);
  });
});
