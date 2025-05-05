import pandas as pd
from sqlalchemy.orm import sessionmaker
from database import engine
from models import Customer, Account, Interaction, Transaction 
from datetime import datetime, time

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_excel_data(excel_file_path):
    """
    Imports data from an Excel spreadsheet into the Customer, Account, Interaction,
    and Transaction tables in the database.

    Args:
        excel_file_path (str): The path to the Excel spreadsheet file.

    Returns:
        None
    """
    try:
        excel_data = pd.read_excel(excel_file_path, sheet_name=None)
        db = SessionLocal()

        try:
            # Import Customer data
            if '2. Customer Data' in excel_data:
                df_customer = excel_data['2. Customer Data']
                for index, row in df_customer.iterrows():
                    customer = Customer(
                        customer_id=str(row['customer-id']),
                        title=row['title'],
                        name=row['name'],
                        surname=row['surname'],
                        nationality=row['nationality'],
                        dob=pd.to_datetime(row['dob'], dayfirst=True) if pd.notnull(row['dob']) else None,
                        address=row['address'],
                        city=row['city'],
                        postcode=row['postcode'],
                        monthly_income=row['monthly-income'],
                        marital_status=row['marital-status']
                    )
                    db.add(customer)
                print("Customer data imported successfully.")

            # Import Account data
            if '3. Account Data' in excel_data:
                df_account = excel_data['3. Account Data']
                for index, row in df_account.iterrows():
                    account = Account(
                        customer_id=str(row['customer-id']),
                        product_id=str(row['product-id']),
                        account_id=str(row['account-id']),
                        starting_balance=row['starting-balance'],
                        since=pd.to_datetime(row['since'], dayfirst=True) if pd.notnull(row['since']) else None
                    )
                    db.add(account)
                print("Account data imported successfully.")

            # Import Interaction data
            if '5. Interaction Data' in excel_data:
                df_interaction = excel_data['5. Interaction Data']
                for index, row in df_interaction.iterrows():
                    interaction = Interaction(
                        visit_id=str(row['visit-id']),
                        customer_id=str(row['customer-id']),
                        visit_type=row['visit-type'],
                        visit_date=pd.to_datetime(row['visit-date'], dayfirst=True) if pd.notnull(row['visit-date']) else None,
                        area_id=row['area-id'],
                        area_view_open_time=pd.to_datetime(row['area-view-open-time'], dayfirst=True) if pd.notnull(row['area-view-open-time']) else None,
                        area_view_close_time=pd.to_datetime(row['area-view-close-time'], dayfirst=True) if pd.notnull(row['area-view-close-time']) else None
                    )
                    db.add(interaction)
                print("Interaction data imported successfully.")

            # Import Transaction data
            if '4. Transaction Data' in excel_data:
                df_transaction = excel_data['4. Transaction Data']
                for index, row in df_transaction.iterrows():
                    # Combine date and time into a single datetime object
                    transaction_date = pd.to_datetime(row['transaction.date'], dayfirst=True) if pd.notnull(row['transaction.date']) else None
                    
                    # Handle time separately
                    if pd.notnull(row['transaction.time']):
                        if isinstance(row['transaction.time'], time):
                            transaction_time = row['transaction.time']
                        else:
                            # Convert string or other format to time object
                            try:
                                time_str = str(row['transaction.time'])
                                transaction_time = datetime.strptime(time_str, '%H:%M:%S').time()
                            except ValueError:
                                transaction_time = datetime.strptime(time_str, '%H:%M').time()
                    else:
                        transaction_time = None

                    # If we have both date and time, combine them
                    if transaction_date and transaction_time:
                        full_datetime = datetime.combine(transaction_date.date(), transaction_time)
                    else:
                        full_datetime = transaction_date

                    transaction = Transaction(
                        transaction_id=str(row['transaction.id']),
                        account_id=str(row['account.id']),
                        transaction_date=transaction_date,
                        transaction_time=full_datetime,
                        transaction_amount=row['transaction.amount'],
                        payment_type=row['payment.type'],
                        transaction_category=row['transaction.category'],
                        transaction_reference=row['transaction.reference']
                    )
                    db.add(transaction)
                print("Transaction data imported successfully.")

            db.commit()
            print("All data committed to the database.")

        except Exception as e:
            db.rollback()
            print(f"An error occurred during database import: {e}")
            raise  # Re-raise the exception to see the full traceback
        finally:
            db.close()

    except FileNotFoundError:
        print(f"Error: Excel file not found at path: {excel_file_path}")
    except Exception as e:
        print(f"An error occurred while reading the Excel file: {e}")

if __name__ == "__main__":
    excel_file = "data set/Lloyds Data Set.xlsx"
    import_excel_data(excel_file)
    print("Data import process finished.")