import { Paper, Title, Text, Stack, Divider, Box, Anchor, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconScale } from '@tabler/icons-react';

export function SCTAPage() {
  const { i18n } = useTranslation();
  const isJapanese = i18n.language === 'ja';

  return (
    <Box py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Stack gap="xl">
          {/* Header */}
          <Box>
            <Group mb="md">
              <IconScale size={32} color="var(--mantine-color-primary-6)" />
              <Title order={1} c="primary">
                {isJapanese ? '特定商取引法に基づく表記' : 'Specified Commercial Transaction Act Disclosure'}
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {isJapanese
                ? '特定商取引法に基づき、以下の通り表記いたします。'
                : 'The following information is provided in accordance with the Specified Commercial Transaction Act of Japan.'}
            </Text>
          </Box>

          <Divider />

          {/* Business Name */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '販売事業者名' : 'Business Name'}
            </Text>
            <Text>Aux Merveilleux de Fred Tokyo</Text>
          </Stack>

          <Divider />

          {/* Business Operator */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '運営責任者' : 'Business Operator'}
            </Text>
            <Text>Gaelle Martinez / Alexandre Tranchellini / Cali Martinez</Text>
          </Stack>

          <Divider />

          {/* Location */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '所在地' : 'Business Address'}
            </Text>
            <Text>〒162-0805</Text>
            <Text>東京都新宿区矢来町107番地2</Text>
            {!isJapanese && (
              <Text size="sm" c="dimmed">
                107-2 Yaraicho, Shinjuku-ku, Tokyo 162-0805, Japan
              </Text>
            )}
          </Stack>

          <Divider />

          {/* Contact Information */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '連絡先' : 'Contact Information'}
            </Text>
            <Text>
              {isJapanese ? '電話番号' : 'Phone'}: <Anchor href="tel:+81335798353">+81 3-5579-8353</Anchor>
            </Text>
            <Text>
              {isJapanese ? 'お問い合わせ' : 'Inquiries'}:{' '}
              <Anchor href="https://auxmerveilleux.com/ja/contact-us" target="_blank">
                {isJapanese ? 'お問い合わせフォーム' : 'Contact Form'}
              </Anchor>
            </Text>
          </Stack>

          <Divider />

          {/* Product Pricing */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '販売価格' : 'Product Pricing'}
            </Text>
            <Text>
              {isJapanese ? '各商品ページに記載の価格（消費税込み）' : 'Prices are listed on each product page (including consumption tax)'}
            </Text>
          </Stack>

          <Divider />

          {/* Additional Costs */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '商品代金以外の必要料金' : 'Additional Costs'}
            </Text>
            <Text>{isJapanese ? 'なし（配送料金は商品価格に含まれています）' : 'None (delivery fees are included in the product price)'}</Text>
          </Stack>

          <Divider />

          {/* Payment Methods */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? 'お支払い方法' : 'Payment Methods'}
            </Text>
            <Text>
              {isJapanese
                ? 'クレジットカード決済（Visa、MasterCard、American Express）、PayPay'
                : 'Credit card (Visa, MasterCard, American Express), PayPay'}
            </Text>
            <Text size="sm" c="dimmed">
              {isJapanese ? '決済代行：Stripe' : 'Payment processing: Stripe'}
            </Text>
          </Stack>

          <Divider />

          {/* Payment Timing */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? 'お支払い時期' : 'Payment Timing'}
            </Text>
            <Text>{isJapanese ? 'ご注文確定時に決済が行われます' : 'Payment is processed when the order is confirmed'}</Text>
          </Stack>

          <Divider />

          {/* Delivery Timing */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '商品のお渡し時期' : 'Delivery Timing'}
            </Text>
            <Text>
              {isJapanese
                ? 'ご注文時に指定いただいた日時にお渡しいたします'
                : 'Products will be delivered at the date and time specified during order'}
            </Text>
          </Stack>

          <Divider />

          {/* Cancellation Policy */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '返品・キャンセルについて' : 'Returns and Cancellation Policy'}
            </Text>
            <Text>
              {isJapanese
                ? '生鮮食品のため、お客様都合による返品・キャンセルはお受けできません。'
                : 'As these are perishable food items, we cannot accept returns or cancellations due to customer convenience.'}
            </Text>
            <Text>
              {isJapanese
                ? '商品に不備があった場合は、お受け取り当日中にご連絡ください。'
                : 'If there is a defect with the product, please contact us on the day of receipt.'}
            </Text>
            <Text size="sm" c="dimmed">
              {isJapanese ? 'キャンセル期限：受取日の2日前まで' : 'Cancellation deadline: Up to 2 days before pickup date'}
            </Text>
          </Stack>

          <Divider />

          {/* Consumer Protection */}
          <Stack gap="xs">
            <Text fw={600} size="sm" c="dimmed">
              {isJapanese ? '特別な販売条件' : 'Special Sales Conditions'}
            </Text>
            <Text>
              {isJapanese
                ? 'この販売は予約販売です。オンライン決済完了後、ご予約が確定いたします。'
                : 'This is a reservation-based sale. Your reservation is confirmed upon completion of online payment.'}
            </Text>
          </Stack>

          <Divider />

          {/* Disclaimer */}
          <Box mt="md" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
            <Text size="xs" c="dimmed">
              {isJapanese ? (
                <>
                  本ページは特定商取引法（平成12年法律第57号）第11条に基づく表記です。
                  <br />
                  ご不明な点がございましたら、上記の連絡先までお問い合わせください。
                </>
              ) : (
                <>
                  This page is provided in accordance with Article 11 of the Specified Commercial Transaction Act (Act No. 57 of 2000).
                  <br />
                  If you have any questions, please contact us using the information above.
                </>
              )}
            </Text>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
