/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dateElements = screen.getAllByTestId('bill-date'); // Select all date elements by their test ID

      // Extract the innerText of each date element
      const dates = dateElements.map(el => el.innerHTML);

      // Parse the displayed dates into Date objects for comparison
      const parsedDates = dates.map(date => new Date(date));

      // Create a sorted version of the parsed dates (from earliest to latest)
      const sortedDates = [...parsedDates].sort((a, b) => a - b);

      // Check if the parsed dates match the sorted version
      expect(parsedDates).toEqual(sortedDates);
    })
  })
})
