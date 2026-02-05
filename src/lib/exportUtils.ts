import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface ReportData {
  period: string;
  sales: number;
  transactions: number;
  profit: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

interface TransactionDetail {
  id: string;
  transaction_id: string;
  total_amount: number;
  profit: number;
  payment_method: string;
  items_count: number;
  created_at: string;
  sale_items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export const exportToPDF = (data: ReportData, shopName: string = "Mama Duka") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text(shopName, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.period} Sales Report`, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });
  
  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 20, 55);
  
  doc.setFontSize(10);
  doc.text(`Total Sales: KSh ${data.sales.toLocaleString()}`, 20, 65);
  doc.text(`Total Transactions: ${data.transactions}`, 20, 72);
  doc.text(`Total Profit: KSh ${data.profit.toLocaleString()}`, 20, 79);
  const avgTransaction = data.transactions > 0 ? Math.round(data.sales / data.transactions) : 0;
  doc.text(`Average Transaction: KSh ${avgTransaction.toLocaleString()}`, 20, 86);
  
  // Top Products section
  doc.setFontSize(12);
  doc.text('Top Selling Products', 20, 105);
  
  doc.setFontSize(10);
  let yPos = 115;
  data.topProducts.forEach((product, index) => {
    doc.text(`${index + 1}. ${product.name}`, 20, yPos);
    doc.text(`${product.quantity} units`, 100, yPos);
    doc.text(`KSh ${product.revenue.toLocaleString()}`, 140, yPos);
    yPos += 8;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by Mama Duka POS', pageWidth / 2, 280, { align: 'center' });
  
  // Save the PDF
  doc.save(`${shopName}_${data.period}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (data: ReportData, shopName: string = "Mama Duka") => {
  // Summary sheet data
  const summaryData = [
    ['Shop Name', shopName],
    ['Report Period', data.period],
    ['Generated', new Date().toLocaleString()],
    [''],
    ['Metric', 'Value'],
    ['Total Sales', `KSh ${data.sales.toLocaleString()}`],
    ['Total Transactions', data.transactions],
    ['Total Profit', `KSh ${data.profit.toLocaleString()}`],
    ['Average Transaction', `KSh ${(data.transactions > 0 ? Math.round(data.sales / data.transactions) : 0).toLocaleString()}`],
  ];
  
  // Top products sheet data
  const productsData = [
    ['Rank', 'Product Name', 'Quantity Sold', 'Revenue'],
    ...data.topProducts.map((p, i) => [i + 1, p.name, p.quantity, `KSh ${p.revenue.toLocaleString()}`])
  ];
  
  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
  
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(wb, productsSheet, 'Top Products');
  
  // Save the file
  XLSX.writeFile(wb, `${shopName}_${data.period}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// NEW: Export detailed transactions with all items
export const exportDetailedTransactionsPDF = (
  transactions: TransactionDetail[],
  period: string,
  shopName: string = "Mama Duka"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text(shopName, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${period} Detailed Transactions`, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });
  doc.text(`Total Transactions: ${transactions.length}`, pageWidth / 2, 44, { align: 'center' });
  
  let yPos = 55;
  
  transactions.forEach((txn, txnIndex) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Transaction header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 4, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const time = new Date(txn.created_at).toLocaleString();
    const paymentLabel = txn.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash';
    doc.text(`#${txnIndex + 1} | ${txn.transaction_id} | ${time} | ${paymentLabel}`, 20, yPos);
    doc.text(`KSh ${Number(txn.total_amount).toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 10;
    
    // Items
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    for (const item of txn.sale_items || []) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`  • ${item.product_name}`, 20, yPos);
      doc.text(`${item.quantity} x KSh ${item.unit_price}`, 110, yPos);
      doc.text(`KSh ${Number(item.total_price).toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 6;
    }
    
    yPos += 5;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  doc.text(`Total Revenue: KSh ${totalSales.toLocaleString()}`, pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.save(`${shopName}_${period}_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportDetailedTransactionsExcel = (
  transactions: TransactionDetail[],
  topProducts: { name: string; quantity: number; revenue: number }[],
  period: string,
  shopName: string = "Mama Duka"
) => {
  // Transactions summary sheet
  const txnSummary = [
    ['Transaction ID', 'Date/Time', 'Payment Method', 'Items Count', 'Total Amount', 'Profit'],
    ...transactions.map(t => [
      t.transaction_id,
      new Date(t.created_at).toLocaleString(),
      t.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash',
      t.items_count,
      Number(t.total_amount),
      Number(t.profit)
    ])
  ];
  
  // All items detail sheet
  const itemsDetail: (string | number)[][] = [
    ['Transaction ID', 'Date/Time', 'Product Name', 'Quantity', 'Unit Price', 'Total Price', 'Payment Method']
  ];
  
  for (const txn of transactions) {
    for (const item of txn.sale_items || []) {
      itemsDetail.push([
        txn.transaction_id,
        new Date(txn.created_at).toLocaleString(),
        item.product_name,
        item.quantity,
        Number(item.unit_price),
        Number(item.total_price),
        txn.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash'
      ]);
    }
  }
  
  // Top products sheet
  const topProductsData = [
    ['Rank', 'Product Name', 'Quantity Sold', 'Revenue'],
    ...topProducts.map((p, i) => [i + 1, p.name, p.quantity, Number(p.revenue)])
  ];
  
  // Summary stats
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const totalProfit = transactions.reduce((sum, t) => sum + Number(t.profit), 0);
  const mpesaCount = transactions.filter(t => t.payment_method === 'mpesa').length;
  const cashCount = transactions.filter(t => t.payment_method === 'cash').length;
  
  const summarySheet = [
    ['Shop Name', shopName],
    ['Report Period', period],
    ['Generated', new Date().toLocaleString()],
    [''],
    ['Summary Statistics'],
    ['Total Transactions', transactions.length],
    ['Total Sales', totalSales],
    ['Total Profit', totalProfit],
    ['M-Pesa Transactions', mpesaCount],
    ['Cash Transactions', cashCount],
  ];
  
  const wb = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), 'Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txnSummary), 'Transactions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsDetail), 'All Items Sold');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topProductsData), 'Top Products');
  
  XLSX.writeFile(wb, `${shopName}_${period}_Detailed_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  costPrice: number;
}

export const exportStockToPDF = (products: ProductData[], shopName: string = "Mama Duka") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 128, 128);
  doc.text(shopName, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Stock Inventory Report', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });
  
  // Table header
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 240, 240);
  doc.rect(15, 50, pageWidth - 30, 8, 'F');
  doc.text('Product', 20, 56);
  doc.text('Category', 70, 56);
  doc.text('Stock', 110, 56);
  doc.text('Cost', 135, 56);
  doc.text('Price', 165, 56);
  
  // Table rows
  let yPos = 66;
  products.forEach((product) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(product.name.substring(0, 25), 20, yPos);
    doc.text(product.category, 70, yPos);
    doc.text(product.stock.toString(), 110, yPos);
    doc.text(`KSh ${product.costPrice}`, 135, yPos);
    doc.text(`KSh ${product.price}`, 165, yPos);
    yPos += 8;
  });
  
  // Summary
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  yPos += 10;
  doc.setFontSize(11);
  doc.text(`Total Products: ${products.length}`, 20, yPos);
  doc.text(`Total Stock Value: KSh ${totalValue.toLocaleString()}`, 20, yPos + 8);
  
  doc.save(`${shopName}_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportStockToExcel = (products: ProductData[], shopName: string = "Mama Duka") => {
  const data = [
    ['Product Name', 'Category', 'Stock', 'Cost Price', 'Sell Price', 'Stock Value'],
    ...products.map(p => [p.name, p.category, p.stock, p.costPrice, p.price, p.stock * p.costPrice])
  ];
  
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  data.push([]);
  data.push(['Total Products', products.length, '', '', 'Total Value', totalValue]);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Stock');
  
  XLSX.writeFile(wb, `${shopName}_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

export const generateReceipt = (items: SaleItem[], total: number, paymentMethod: string, shopName: string = "Mama Duka") => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150 + items.length * 8]
  });
  
  const pageWidth = 80;
  const transactionId = `TXN${Date.now().toString().slice(-8)}`;
  
  // Header
  doc.setFontSize(14);
  doc.text(shopName, pageWidth / 2, 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.text('Official Receipt', pageWidth / 2, 16, { align: 'center' });
  doc.text(`${new Date().toLocaleString()}`, pageWidth / 2, 21, { align: 'center' });
  doc.text(`Transaction: ${transactionId}`, pageWidth / 2, 26, { align: 'center' });
  
  // Divider
  doc.setLineWidth(0.5);
  doc.line(5, 30, 75, 30);
  
  // Items
  doc.setFontSize(8);
  let yPos = 38;
  items.forEach((item) => {
    doc.text(item.name, 5, yPos);
    doc.text(`${item.quantity} x ${item.price}`, 45, yPos);
    doc.text(`${item.quantity * item.price}`, 70, yPos, { align: 'right' });
    yPos += 6;
  });
  
  // Divider
  doc.line(5, yPos, 75, yPos);
  yPos += 8;
  
  // Total
  doc.setFontSize(10);
  doc.text('TOTAL:', 5, yPos);
  doc.text(`KSh ${total.toLocaleString()}`, 70, yPos, { align: 'right' });
  yPos += 8;
  
  doc.setFontSize(8);
  doc.text(`Payment: ${paymentMethod}`, 5, yPos);
  yPos += 12;
  
  // Footer
  doc.text('Thank you for shopping with us!', pageWidth / 2, yPos, { align: 'center' });
  
  doc.save(`Receipt_${transactionId}.pdf`);
  return transactionId;
};
