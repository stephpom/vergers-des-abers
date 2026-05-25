import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../utils";
import ProductImagesSection from "@/components/admin/ProductImagesSection";
import type { ApiProductImage } from "@/types/api";

const mockImages: ApiProductImage[] = [
  { id: "img-1", filename: "pomme1.jpg", alt: "Pomme principale", position: 0 },
  { id: "img-2", filename: "pomme2.jpg", alt: "Pomme secondaire", position: 1 },
];

function renderSection(overrides: Partial<React.ComponentProps<typeof ProductImagesSection>> = {}) {
  const props = {
    images: mockImages,
    uploading: false,
    reorderPending: false,
    onUploadClick: vi.fn(),
    onDelete: vi.fn(),
    onSetMain: vi.fn(),
    onMove: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<ProductImagesSection {...props} />), props };
}

describe("ProductImagesSection", () => {
  it("affiche les images passées en props par alt text", () => {
    renderSection();
    expect(screen.getByAltText("Pomme principale")).toBeInTheDocument();
    expect(screen.getByAltText("Pomme secondaire")).toBeInTheDocument();
  });

  it('affiche le badge "Principale" sur la première image uniquement', () => {
    renderSection();
    const badges = screen.getAllByText("Principale");
    expect(badges).toHaveLength(1);
  });

  it("bouton étoile désactivé sur la première image", () => {
    renderSection();
    const starButtons = screen.getAllByRole("button", { name: /définir comme principale/i });
    expect(starButtons[0]).toBeDisabled();
    expect(starButtons[1]).not.toBeDisabled();
  });

  it('bouton "Ajouter une image" présent et appelle onUploadClick', async () => {
    const user = userEvent.setup();
    const { props } = renderSection();
    const btn = screen.getByRole("button", { name: /ajouter une image/i });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(props.onUploadClick).toHaveBeenCalledTimes(1);
  });

  it("click sur \"Supprimer l'image\" → appelle onDelete avec l'imageId", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();
    const deleteButtons = screen.getAllByRole("button", { name: /supprimer l'image/i });
    await user.click(deleteButtons[0]);
    expect(props.onDelete).toHaveBeenCalledWith("img-1");
  });

  it("click sur étoile de la deuxième image → appelle onSetMain(1)", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();
    const starButtons = screen.getAllByRole("button", { name: /définir comme principale/i });
    await user.click(starButtons[1]);
    expect(props.onSetMain).toHaveBeenCalledWith(1);
  });

  it("click ChevronDown sur la première image → appelle onMove(0, 1)", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();
    const downButtons = screen.getAllByRole("button", { name: /déplacer après/i });
    await user.click(downButtons[0]);
    expect(props.onMove).toHaveBeenCalledWith(0, 1);
  });
});
