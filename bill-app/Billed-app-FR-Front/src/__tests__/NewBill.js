/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"


describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {
    test("Then it should render the new form bill", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    });

    test("Then all fields in the form should be visible", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;


      expect(screen.getByTestId('expense-name')).toBeTruthy();

      const expenseType = screen.getByTestId("expense-type")
      fireEvent.change(expenseType, { target: { value: "Transports" } })
      expect(expenseType.value).toBe("Transports")

      const datePicker = screen.getByTestId("datepicker")
      fireEvent.change(datePicker, { target: { value: "2023-04-15" } })
      expect(datePicker.value).toBe("2023-04-15")

      const amount = screen.getByTestId("amount")
      fireEvent.change(amount, { target: { value: "100" } })
      expect(amount.value).toBe("100")

      const file = screen.getByTestId("file")
      const testFile = new File(['test'], 'test.png', { type: 'image/png' })
      fireEvent.change(file, { target: { files: [testFile] } })
      expect(file.files[0].name).toBe("test.png")

      expect(screen.getByTestId('vat')).toBeTruthy();
      expect(screen.getByTestId('pct')).toBeTruthy();
      expect(screen.getByTestId('commentary')).toBeTruthy();
      expect(screen.getByText("Envoyer")).toBeTruthy();
    });
  })
})
