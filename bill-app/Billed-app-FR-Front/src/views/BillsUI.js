import VerticalLayout from './VerticalLayout.js'
import ErrorPage from "./ErrorPage.js"
import LoadingPage from "./LoadingPage.js"
import { formatDate } from '../app/format.js'
import Actions from './Actions.js'

const row = (bill) => {
  return (`
    <tr>
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td data-testid="bill-date">${formatDate(bill.date)}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `)
}

const rows = (data) => {
  if (data && data.length) {
    const filteredData = data.filter(bill => {
      return bill.type && bill.name && bill.date && bill.amount !== undefined && bill.status;
    });

    const sortedData = filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedData.map(bill => row(bill)).join("");
  }
  return "";
};

// Add this function to parse dates 
export const parseDate = (dateString) => {
  const [day, month, year] = dateString.split(' ');
  const monthMap = {
    'Jan.': 0, 'Fév.': 1, 'Mar.': 2, 'Avr.': 3, 'Mai.': 4, 'Juin': 5,
    'Juil.': 6, 'Aoû.': 7, 'Sep.': 8, 'Oct.': 9, 'Nov.': 10, 'Déc.': 11
  };
  const parsedYear = year.length === 2 ? `20${year}` : year;  // Adjust year parsing
  return new Date(parseInt(parsedYear), monthMap[month], parseInt(day));
};


export default ({ data: bills, loading, error }) => {

  const modal = () => (`
    <div class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `)

  if (loading) {
    return LoadingPage()
  } else if (error) {
    return ErrorPage(error)
  }

  return (`
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(bills)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`
  )
}