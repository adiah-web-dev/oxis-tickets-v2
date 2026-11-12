
from io import BytesIO
from html import escape

import qrcode

from PIL import Image, ImageOps

from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle


def generate_ticket_pdf(ticket):
    """
    Generate a landscape, event-branded PDF ticket.
    """

    width = 10 * inch
    height = 4.25 * inch

    main_width = 7 * inch
    stub_width = width - main_width

    buffer = BytesIO()

    pdf = canvas.Canvas(buffer, pagesize=(width, height))

    order = ticket.order_item.order
    event = order.event
    ticket_type = ticket.order_item.ticket_type

    # -------------------------------------------------
    # Colours
    # -------------------------------------------------

    navy = colors.HexColor("#14213D")
    gold = colors.HexColor("#D4AF37")
    white = colors.white
    dark = colors.HexColor("#202938")
    muted = colors.HexColor("#64748B")

    # -------------------------------------------------
    # Main ticket background
    # -------------------------------------------------

    pdf.setFillColor(navy)
    pdf.rect(0, 0, main_width, height, fill=1, stroke=0)

    artwork_loaded = False

    # -------------------------------------------------
    # Event artwork
    # -------------------------------------------------

    if event.banner_image:
        try:
            event.banner_image.open("rb")

            with Image.open(event.banner_image.file) as source:
                artwork = ImageOps.fit(
                    source.convert("RGB"),
                    (1600, 960),
                    method=Image.Resampling.LANCZOS,
                )

                image_buffer = BytesIO()
                artwork.save(image_buffer, format="JPEG", quality=90)
                image_buffer.seek(0)

            pdf.drawImage(
                ImageReader(image_buffer),
                0,
                0,
                width=main_width,
                height=height,
                preserveAspectRatio=False,
            )

            artwork_loaded = True

        except Exception:
            # Continue with the fallback design if the image
            # is missing or cannot be processed.
            artwork_loaded = False

        finally:
            try:
                event.banner_image.close()
            except Exception:
                pass

    # -------------------------------------------------
    # Fallback artwork
    # -------------------------------------------------

    if not artwork_loaded:
        pdf.setFillColor(navy)
        pdf.rect(0, 0, main_width, height, fill=1, stroke=0)

        pdf.setFillColor(colors.HexColor("#23395D"))
        pdf.circle(
            main_width - 0.5 * inch,
            height - 0.3 * inch,
            2.2 * inch,
            fill=1,
            stroke=0,
        )

        pdf.setFillColor(colors.HexColor("#304B70"))
        pdf.circle(
            main_width - 1.8 * inch,
            0.2 * inch,
            1.8 * inch,
            fill=1,
            stroke=0,
        )

        pdf.setStrokeColor(gold)
        pdf.setLineWidth(2)
        pdf.line(
            0.4 * inch,
            0.35 * inch,
            main_width - 0.4 * inch,
            0.35 * inch,
        )

    # -------------------------------------------------
    # Dark overlay for readable text
    # -------------------------------------------------

    pdf.saveState()
    pdf.setFillColor(colors.HexColor("#000000"))
    pdf.setFillAlpha(0.65)
    pdf.rect(
        0,
        0,
        main_width,
        height,
        fill=1,
        stroke=0,
    )
    pdf.restoreState()

    # -------------------------------------------------
    # School branding
    # -------------------------------------------------

    pdf.setFillColor(gold)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        0.4 * inch,
        height - 0.45 * inch,
        "OXBRIDGE INTERNATIONAL SCHOOL",
    )

    pdf.setFillColor(white)
    pdf.setFont("Helvetica", 7)
    pdf.drawRightString(
        main_width - 0.4 * inch,
        height - 0.45 * inch,
        "OFFICIAL ADMISSION TICKET",
    )

    # -------------------------------------------------
    # Event name
    # -------------------------------------------------

    title_style = ParagraphStyle(
        "EventTitle",
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=29,
        textColor=white,
    )

    title = Paragraph(
        escape(event.name),
        title_style,
    )

    title_width = main_width - 0.8 * inch
    title_height = 1.2 * inch

    actual_width, actual_height = title.wrap(
        title_width,
        title_height,
    )

    title.drawOn(
        pdf,
        0.4 * inch,
        2.25 * inch,
    )

    # -------------------------------------------------
    # Event details
    # -------------------------------------------------

    event_date = timezone.localtime(
        event.start_date
    ).strftime("%A, %d %B %Y")

    event_time = timezone.localtime(
        event.start_date
    ).strftime("%I:%M %p")

    pdf.setFillColor(white)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(
        0.4 * inch,
        1.35 * inch,
        event_date,
    )

    pdf.setFont("Helvetica", 9)
    pdf.drawString(
        0.4 * inch,
        1.05 * inch,
        f"{event_time}  |  {event.venue[:70]}",
    )

    # -------------------------------------------------
    # Purchaser
    # -------------------------------------------------

    pdf.setFillColor(gold)
    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawString(
        0.4 * inch,
        0.62 * inch,
        "ADMITTED TO",
    )

    pdf.setFillColor(white)
    pdf.setFont("Helvetica", 10)
    pdf.drawString(
        0.4 * inch,
        0.42 * inch,
        order.customer_name[:55],
    )

    # -------------------------------------------------
    # Ticket stub
    # -------------------------------------------------

    pdf.setFillColor(colors.HexColor("#F8FAFC"))
    pdf.rect(
        main_width,
        0,
        stub_width,
        height,
        fill=1,
        stroke=0,
    )

    # Perforation line
    pdf.saveState()
    pdf.setStrokeColor(muted)
    pdf.setDash(3, 3)
    pdf.setLineWidth(1)
    pdf.line(
        main_width,
        0,
        main_width,
        height,
    )
    pdf.restoreState()

    # Perforation circles
    pdf.setFillColor(colors.HexColor("#F8FAFC"))
    pdf.circle(main_width, height, 0.09 * inch, fill=1, stroke=0)
    pdf.circle(main_width, 0, 0.09 * inch, fill=1, stroke=0)

    # Stub heading
    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawCentredString(
        main_width + stub_width / 2,
        height - 0.45 * inch,
        "ADMIT ONE",
    )

    # -------------------------------------------------
    # QR code
    # -------------------------------------------------

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )

    qr.add_data(ticket.ticket_code)
    qr.make(fit=True)

    qr_image = qr.make_image(
        fill_color="black",
        back_color="white",
    )

    qr_buffer = BytesIO()
    qr_image.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)

    qr_size = 1.55 * inch

    qr_x = main_width + (stub_width - qr_size) / 2
    qr_y = 1.35 * inch

    pdf.drawImage(
        ImageReader(qr_buffer),
        qr_x,
        qr_y,
        width=qr_size,
        height=qr_size,
    )

    # -------------------------------------------------
    # Ticket code
    # -------------------------------------------------

    pdf.setFillColor(navy)
    pdf.setFont("Helvetica-Bold", 9)

    pdf.drawCentredString(
        main_width + stub_width / 2,
        1.05 * inch,
        ticket.ticket_code,
    )

    # Ticket type
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8)

    pdf.drawCentredString(
        main_width + stub_width / 2,
        0.78 * inch,
        ticket_type.name[:35],
    )

    # Entry instruction
    pdf.setFont("Helvetica", 6)
    pdf.drawCentredString(
        main_width + stub_width / 2,
        0.35 * inch,
        "Present QR code at entry",
    )

    # -------------------------------------------------
    # Finish PDF
    # -------------------------------------------------

    pdf.showPage()
    pdf.save()

    buffer.seek(0)

    return buffer
