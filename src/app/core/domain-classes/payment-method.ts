export class PaymentMethod {
    id: number;
    name: string;
}


export const paymentMethods: PaymentMethod[] = [
    {
        id: 0,
        name: 'CASH'
    }, {
        id: 1,
        name: 'CHEQUE'
    }, {
        id: 2,
        name: 'CREDIT_CARD'
    }, {
        id: 3,
        name: 'COD'
    }, {
        id: 4,
        name: 'OTHER'
    },{
        id: 5,
        name: 'Paytm & Online Payment'
    }
];