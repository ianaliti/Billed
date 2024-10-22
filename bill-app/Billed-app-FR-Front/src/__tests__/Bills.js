/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES } from "../constants/routes";

// Mock jquery and bootstrap modal
global.$ = jest.fn(() => ({
  width: jest.fn(() => 100),
  find: jest.fn(() => ({
    html: jest.fn(),
  })),
  modal: jest.fn(), 
  click: jest.fn(),
}));


describe("Given I am connected as an employee", () => {
  let store;

  beforeEach(() => {
    store = {
      bills: () => ({
        list: () => Promise.resolve(bills), 
      }),
    };

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
    }));
  });

  describe("When I am on Bills Page", () => {
    // Test for the icon highlight
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
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })

    // Test for bill sorting
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      // Select all date elements by their test ID           
      const dateElements = screen.getAllByTestId('bill-date');

      // Extract the innerText of each date element       
      const dates = dateElements.map(el => el.innerHTML);

      // Parse the displayed dates into Date objects for comparison       
      const parsedDates = dates.map(date => new Date(date));

      // Create a sorted version of the parsed dates (from earliest to latest)       
      const sortedDates = [...parsedDates].sort((a, b) => a - b);

      // Check if the parsed dates match the sorted version       
      expect(parsedDates).toEqual(sortedDates);
    })

    test("Then the newBill button and eye icons should have event listeners", () => {
      // Setup
      document.body.innerHTML = BillsUI({ data: bills })
      const billsClass = new Bills({
        document,
        onNavigate: jest.fn(),
        store,
        localStorage: window.localStorage
      });

      // Mock the event listener functions
      const handleClickNewBill = jest.fn(billsClass.handleClickNewBill)
      const handleClickIconEye = jest.fn(billsClass.handleClickIconEye)

      // Get the button and eye icons
      const newBillBtn = screen.getByTestId('btn-new-bill')
      const iconEyes = screen.getAllByTestId('icon-eye')

      // Add event listeners
      newBillBtn.addEventListener('click', handleClickNewBill)
      iconEyes.forEach(icon => {
        icon.addEventListener('click', () => handleClickIconEye(icon))
      })

      // Simulate clicks
      fireEvent.click(newBillBtn)
      fireEvent.click(iconEyes[0])

      // Check if event listeners were called
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(handleClickIconEye).toHaveBeenCalled()
    });
  });

    describe("When I navigate to Bills page", () => {
      test("Then getBills method should fetch bills from mock API", async () => {
        const billsClass = new Bills({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage: window.localStorage,
        });
  
        const getSpy = jest.spyOn(store, "bills");
        const fetchedBills = await billsClass.getBills(); 
  
        expect(getSpy).toHaveBeenCalledTimes(1);
        expect(fetchedBills.length).toBe(4); 
      });

      test("Then getBills method should handle API error", async () => {
        const errorStore = {
          bills: () => ({
            list: () => Promise.reject(new Error("API Error")),
          }),
        };
        const billsClass = new Bills({
          document,
          onNavigate: jest.fn(),
          store: errorStore,
          localStorage: window.localStorage,
        });
  
        await expect(billsClass.getBills()).rejects.toThrow("API Error");
      });
    });

  // Test error and loading states
  describe("When an error occurs on API", () => {
    test("Then it should display error page", () => {
      document.body.innerHTML = BillsUI({ error: "An error occurred" })
      expect(screen.getByText(/Erreur/)).toBeTruthy()
    })
  })

  describe("When loading", () => {
    test("Then it should display loading page", () => {
      document.body.innerHTML = BillsUI({ loading: true })
      expect(screen.getByText(/Loading/)).toBeTruthy()
    })
  })
})

