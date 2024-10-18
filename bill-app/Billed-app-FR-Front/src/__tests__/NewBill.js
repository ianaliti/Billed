/**
 * @jest-environment jsdom
 */

import { waitFor, screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"


describe("Given I am connected as an employee", () => {

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'employee@test.com'
    }));
    document.body.innerHTML = NewBillUI();
  });

  describe("When I am on NewBill Page", () => {
    test("Then it should render the new form bill", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    });

    test("Then I should be able to upload a valid file", async () => {
      const onNavigate = jest.fn();
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorage });

      const fileInput = screen.getByTestId("file");
      const validFile = new File(["file content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      expect(fileInput.files[0].name).toBe("test.png");
    });

    test("Then it should show an error when uploading an invalid file format", async () => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = jest.fn();
      global.alert = jest.fn();  

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: localStorage });

      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["content"], "test.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, {
        target: { files: [invalidFile] },
      });

      expect(fileInput.value).toBe('');
      expect(global.alert).toHaveBeenCalledTimes(1);
    });
  })

  describe("When I fill out the new bill form", () => {
    const html = NewBillUI()
    document.body.innerHTML = html;

    test("Then a new bill should be created with valid data", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = jest.fn();

      const updateMock = jest.fn(() => Promise.resolve({}))
      mockStore.bills = jest.fn(() => ({
        update: updateMock
      }));

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Fill in the form with valid data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-15" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });

      // Mock a valid file upload
      const validFile = new File(["file content"], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByTestId("file"), { target: { files: [validFile] } });

      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(mockStore.bills().update).toHaveBeenCalled();
      });
    });

    test("Then it should handle errors during form submission", async () => {
      const onNavigate = jest.fn();
      console.error = jest.fn(); // Mock console.error

      mockStore.bills.mockImplementationOnce(() => ({
        update: jest.fn().mockRejectedValue(new Error("Form submission failed"))
      }));

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Fill in the form with valid data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-15" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });

      // Mock a valid file upload
      const validFile = new File(["file content"], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByTestId("file"), { target: { files: [validFile] } });

      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockStore.bills().update).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("Form submission failed"));
      });
    });
  })

  describe("When I submit the form with valid data", () => {
    test("Then a new bill should be created", async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const updateMock = jest.fn().mockResolvedValue({});

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: updateMock,
        };
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      fireEvent.submit(form)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
        expect(updateMock).toHaveBeenCalled()
      })
    })
  })
})
