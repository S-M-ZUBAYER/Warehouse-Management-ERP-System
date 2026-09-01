import { useTranslation } from "react-i18next";
import ConfirmActionModal from "./ConfirmActionModal";

export default function CompanyPlanAccessModal({ open, hasError, onCancel, onConfirm }) {
  const { t } = useTranslation();

  return (
    <ConfirmActionModal
      open={open}
      title={t("subscription.companyActionAccessTitle", {
        defaultValue: "Purchase Plan Required",
      })}
      message={
        <p>
          {hasError
            ? t("subscription.companyActionAccessVerifyError", {
                defaultValue:
                  "We could not verify this company's store plan. Please refresh the page or purchase any plan for any store before continuing.",
              })
            : t("subscription.companyActionAccessMessage", {
                defaultValue:
                  "This action is available only when this company has at least one store with active plan days or free trial days. Please purchase any plan for any store first, then try again.",
              })}
        </p>
      }
      confirmLabel={t("subscription.manualOrderAccessPurchasePlan", {
        defaultValue: "Purchase Plan",
      })}
      cancelLabel={t("subscription.cancel", { defaultValue: "Cancel" })}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
