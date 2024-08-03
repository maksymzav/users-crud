import {ComponentHarness} from '@angular/cdk/testing';
import {MatHeaderCellHarness, MatHeaderRowHarness, MatRowHarness} from '@angular/material/table/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatInputHarness} from '@angular/material/input/testing';

const editableCellsNumber = 3;

export class UsersHarness extends ComponentHarness {
  static hostSelector = 'app-users';

  private getHeaderRowHarness = this.locatorFor(MatHeaderRowHarness);
  private getRowHarnesses = this.locatorForAll(MatRowHarness);

  async getColumnTitles(): Promise<string[]> {
    const headerRowHarness = await this.getHeaderRowHarness();
    const cells = await headerRowHarness.getCells();
    return Promise.all(cells.map((cellHarness: MatHeaderCellHarness) => cellHarness.getText()));
  }

  async getCellsDataForRow(index: number): Promise<string[]> {
    const rowHarness = await this.getRowHarness(index);
    const cells = await rowHarness.getCells();
    return Promise.all(cells.map((cellHarness: MatHeaderCellHarness) => cellHarness.getText()));
  }

  async isRowEditable(index: number): Promise<boolean> {
    const rowHarness = await this.getRowHarness(index);
    const cells = await rowHarness.getCells();
    const childLoaders = await Promise.all(cells.map(async cell => await cell.getAllChildLoaders('[data-test="users-cell-edit-enabled"]')));
    const cellsWithEditingEnabled = childLoaders.filter(arr => arr.length > 0);
    return cellsWithEditingEnabled.length === editableCellsNumber;
  }


  async enableRowEditing(index: number): Promise<void> {
    return this.clickActionsButtonOnRow(index);
  }

  async saveRowChanges(index: number): Promise<void> {
    return this.clickActionsButtonOnRow(index);
  }

  async getInputValuesForRow(index: number) {
    const rowHarness = await this.getRowHarness(index);
    const cells = await rowHarness.getCells();
    const inputsHarnesses: MatInputHarness[] = (await Promise.all(
      cells.map(async cell => await cell.getHarnessOrNull(MatInputHarness))
    )).filter(Boolean) as MatInputHarness[];
    return Promise.all(inputsHarnesses.map(harness => harness.getValue()));
  }

  async setInputValuesForRow(index: number, [newName, newUsername, newEmail]: string[]) {
    const rowHarness = await this.getRowHarness(index);
    const cells = await rowHarness.getCells();
    const [nameHarness, usernameHarness, emailHarness]: MatInputHarness[] = (await Promise.all(
      cells.map(async cell => await cell.getHarnessOrNull(MatInputHarness))
    )).filter(Boolean) as MatInputHarness[];
    await nameHarness.setValue(newName);
    await usernameHarness.setValue(newUsername);
    await emailHarness.setValue(newEmail);
  }

  private async clickActionsButtonOnRow(index: number){
    const rowHarness = await this.getRowHarness(index);
    const cells = await rowHarness.getCells({selector: '[data-test="users-actions-column"]'});
    const button = await cells.at(0)?.getHarness(MatButtonHarness);
    button?.click();
  }

  private async getRowHarness(index: number): Promise<MatRowHarness> {
    const rowHarnesses = await this.getRowHarnesses();
    const rowHarness = rowHarnesses.at(index);
    if (typeof rowHarness === 'undefined') {
      throw Error(`row with index ${index} does not exist`);
    }
    return rowHarness;
  }
}
